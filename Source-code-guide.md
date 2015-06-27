Everybody's doing todos these days, so I've decided to do something different, albeit maybe a bit less useful. We'll be building a film database, with a 1:N relation between directors and films. User authentication baked in. This is not a step-by-step guide, rather a showcase of the most interesting bits of code. If you want to dive right in, the whole application code is available on [github](https://github.com/tomaash/react-example-filmdb). Also, to have a general idea how it looks, you can try out the application running on [Heroku](http://react-example-filmdb.herokuapp.com/).

### Backend

For me, the starting point of a web application is a REST api. For this task, we'll use [node.js](https://nodejs.org/), [koa](http://koajs.com/) middleware library and [MongoDB](https://www.mongodb.org/) database. First, let's define models using [Mongoose](http://mongoosejs.com/) ODM.

#### Models
We need a user model, to allow users to sign up and create other objects:
```js
// server/models/user.js
import mongoose from 'mongoose';
import jsonSelect from 'mongoose-json-select';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  password: {
    type: String,
    required: true
  },
  token: String
});

UserSchema.plugin(jsonSelect, '-__v -password');

export default mongoose.model('user', UserSchema);
```

Attribute `username` has unique index to disallow duplicate usernames on the ODM layer. Both `username` and `password` are set to required. Generated token will be used for authentication. the `jsonSelect` plugin serves to remove password from the REST api.

Then we have the **director** model. Interesting column is `user`, which is a reference to **user** model, and allows us to have separate data for, well, each registered user. The `createdAt` column is auto-populated when the model is being saved to the database. 

```js
// server/models/director.js
import mongoose from 'mongoose';
const DirectorSchema = new mongoose.Schema({
    name: String,
    nationality: String,
    birthday: Date,
    biography: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

export default mongoose.model('director', DirectorSchema);
```

The **film** model is very similar to **director**, and also contains a reference to the **director** object which "owns" the film.

```js
// server/models/film.js
import mongoose from 'mongoose';
const FilmSchema = new mongoose.Schema({
  name: String,
  director: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'director'
  },
  description: String,
  year: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('film', FilmSchema);
```

#### API
And now, with the virtue of `koa-mongo-rest`, the REST CRUD api including search, sort, skip and limit, will just generate itself. I admit, this is not so unique feature now that we have [LoopBack](http://www.toptal.com/nodejs/let-loopback-do-it-a-walkthrough-of-the-node-api-framework-you-ve-been-dreaming-of#find-excellent-architects), but if you want to use koa instead of express, and don't want to get yourself locked in a big framework, it's a way to go. To see the details of the api, take a look at koa-mongo-rest [documentation](https://github.com/t3chnoboy/koa-mongo-rest).

```js
// server/koa.js
import koa from 'koa';
import mongoose from 'mongoose';
import koaRouter from 'koa-router';
import generateApi from 'koa-mongo-rest';

const app = koa()
// Read Heroku production Mongo urls
const mongoUrl = process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || '127.0.0.1:27017/isofilmdb';

mongoose.connect(mongoUrl);
app.use(koaRouter(app));

generateApi(app, Film, '/api');
generateApi(app, Director, '/api');
```

#### Authentication
Of course, we can't use the generic CRUD api for user registration and login, as those are very specific actions. Thanks to koa though, executing a sequence of asynchronous operations with proper error handling has become fun again. 

The register method creates a user account, with a properly hashed and salted `password`, and sets the `token`, which will be later used with API authentication. The only catch here is, `bcrypt` library doesn't return promises, but it's methods expect the last argument to be a callback. The `co` library used in koa doesn't support those calls with yield, but only supports so called *thunks*, which are functions with only one argument, which is the callback. Fortunatelly, it's pretty easy to convert a function to a thunk by [partially applying](http://passy.svbtle.com/partial-application-in-javascript-using-bind) the function using the `bind` keyword. Of course, we could use a [promisified](https://github.com/iceddev/bcrypt-as-promised) version of `bcrypt`, but thath would be half the fun. Then, `User.create` from *mongoose* returns a promise, so there's no need to modify that one. With the `yield` keyword, we can use classic try/catch block, so error handling is easy as well. Here, the error is actually thrown by *mongoose*, when the validation of `User` unique `username` index fails. 

```js
app.post('/auth/register', function *(next) {
  yield next;
  const SALT_WORK_FACTOR = 10;
  const error = {message: 'Username already exists'};
  try {
    const body = this.request.body;
    const salt = yield bcrypt.genSalt.bind(null, SALT_WORK_FACTOR);
    const hash = yield bcrypt.hash.bind(null, body.password, salt);
    body.password = hash;
    body.token = uuid.v1();
    const result = yield User.create(body);
    this.status = 201;
    this.body = result;
  } catch (err) {
    this.status = 409;
    this.body = error;
  }
});
```

To succesfully login, we need to find user by `username` first, and then compare the hashed password using `bcrypt`. We are also going to reset the `token` on each login. Updated user data are send as a response when login is successful.

```js
app.post('/auth/login', function *(next) {
  yield next;
  try {
    const body = this.request.body;
    const error = {message: 'Username and password doesn\'t match'};
    const user = yield User.findOne({
      username: body.username
    });
    if (!user) throw error;
    const match = yield bcrypt.compare.bind(null, body.password, user.password);
    if (!match) throw error;
    user.token = uuid.v1();
    this.status = 201;
    this.body = yield user.save();
  } catch (err) {
    this.status = 401;
    this.body = err;
  }
});
```

When user successfuly logs in, he gets token. To be able to access the api, the token must be set in request header `auth-token`. Following middleware is used to prevent access to api unless user if found in database by supplied token. Notice the destructuring assignment `User.findOne({token})`. The middleware also augments the incoming request so that only data for this specific user are returned by subsequent handlers (which are generated by `koa-mongo-rest`). For `GET` requests, user's **id** is added to `query.conditions` and for other requests, the **id** is added to the request body.

```js
app.use(function *(next) {
  const token = this.req.headers['auth-token'];
  const isApi = !!this.request.url.match(/^\/api/);
  const user = token && (yield User.findOne({token}));
  if (isApi && !user) {
    this.status = 401;
    this.body = '401 Unauthorized';
    return;
  }
  this.request.user = user;
  if (user) {
    // Add user to get condition for API
    if (this.request.method === 'GET') {
      var conditions;
      var query = clone(this.request.query);
      try {
        conditions = (query.conditions && JSON.parse(query.conditions)) || {};
      } catch (err) {
        console.error(err);
        conditions = {};
      }
      conditions.user = user._id;
      query.conditions = JSON.stringify(conditions);
      this.request.query = query;
    }
    // Add user to post data for API
    else if (this.request.body) {
      this.request.body.user = user._id;
    }
  }
  yield next;
});
```

#### Server-side rendering
Now that the api is done, there is one last thing we need to deal with on the backend - the server side rendering of React application. The core of this functionality is provided by `React.renderToString`. Whole React application is included from the frontend, and proper page is rendered on server. This way, we don't need to wait for the client-side JavaScript to run and create the markup - the markup is pre-created on the server for the accessed url, and directly shown in the browser. When the client JavaScript runs, it picks up where server has left. As we are using the `alt` *flux* library, we also need to initialize *flux* on the server using `alt.bootstrap`. It is optionally possible to prefill the *flux* stores with data for rendering, but we skip that part. It is also necessary to decide which component to render for which url. That is the functionality of the client side `Router`, which we will show later in detail. We are using the singleton version of `alt`, so after each render, we need to `alt.flush()` the stores to have them clean for another request. Usin the `iso` addon, the state of *flux* is serialized to the html markup, so that the client knows where to pick up. 

```js
// server.js
app.use(function *(next) {
  // We seed our stores with data
  alt.bootstrap(JSON.stringify({}));
  var iso = new Iso();

  // We use react-router to run the URL that is provided in routes.jsx
  const handler = yield Router.run.bind(this, routes, req.url);
  const content = React.renderToString(React.createElement(handler));

  iso.add(content, alt.flush());
  res.render('layout', {html: iso.render()});
})
```

### Frontend
Finally, we are gettin to the frontend part of our application. Aside from [react](https://facebook.github.io/react/), we are going to use a few other libraries, including:

* [alt](https://github.com/goatslacker/alt)
* [iso](https://github.com/goatslacker/iso)
* [react-router](https://github.com/rackt/react-router)
* [react-bootstrap](http://react-bootstrap.github.io/)
* [axios](https://github.com/mzabriskie/axios)
* [restful.js](https://github.com/marmelab/restful.js)
* [formsy-react](https://github.com/christianalfoni/formsy-react)

First thing we need to do on the fronted is to pickup the server state, and bootstrap `alt` with the data. Then we run `Router` and `React.render` to target container, which will update the server-generated markup as necessary.
```js
Iso.bootstrap(function (state, _, container) {
  // bootstrap the state from the server
  alt.bootstrap(state)
  Router.run(routes, Router.HistoryLocation, function (Handler, req) {
    let node = React.createElement(Handler)
    React.render(node, container)
  })
})
```

#### Routing
As for the routing library, we are using [react-router](https://github.com/rackt/react-router), which comes with handy JSX-based routes definition language:

```js
import React from 'react';
import {Route, DefaultRoute, NotFoundRoute} from 'react-router';

export default (
  <Route name='app' path='/' handler={require('./components/app')}>
    <DefaultRoute
      name='directors'
      path='directors'
      handler={require('./components/directors/directors-table')} />
    <Route
      name='login'
      path='login'
      handler={require('./components/login')} />
    <Route
      name='films'
      path='films'
      handler={require('./components/films')} />
    <NotFoundRoute handler={require('./pages/not-found')} />
  </Route>
);
```

Each route needs to specify `name`, `path` and `handler` component. Pretty straightforward. `react-router` has support for nested routes applied to nested components, which allows for a sort of *template inheritance*. In our application though, we are using only a single level of depth:

```js
@reactMixin.decorate(Router.State)
export default class App extends React.Component {
  render() {
    var navbar;
    if (this.getPathname() !== '/login') {
      navbar = <Navbar />;
    }
    return (
      <div className="container-fluid">
        {navbar}
        <RouteHandler />
        <Footer />
      </div>
    );
  }
}
```

We have just optional `Navbar` in header, `RouteHandler` as main content, and a `Footer`. `Navbar` is visible on all pages, except `login`. Note the `@reactMixin.decorate(Router.State)` decorator. So far, mixins were one of the favourite ways of reusing functionality in React, and many libraries depend on it. `react-router` is no exception. Alas, mixins have recently gone [out of fashion](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750). You cannot use mixins in ES6 classes. It's true, it would be a shame to implement yet another proprietary way of augmenting classes, when we already have decorators. And with the [react-mixin](https://github.com/brigand/react-mixin) library, you can just drop-in the good old mixin into the `decorate` function, and magically, you have mixins back. They might be on the way out, but for the present, we need a way to use them until they are rewritten into something else. For this particular `Router.State` mixin, it has a rather simple function - it extend out component with `path` awareness, including the `getPathname` function.

Now that we have the basic structure of the frontend application, we can proceed to creating actual components. According to [react-router](https://github.com/rackt/react-router) authors, this is the correct way of reasoning about a web applications:
> Make the URL your first thought, not an after-thought.

#### Flux
But before jumping into components, let's take a quick flux refresh. Facebook's flux [documentation](https://facebook.github.io/flux/docs/overview.html) speaks a lot about dispatcher, but we are free to skip that, because in [alt](https://github.com/goatslacker/alt), dispatcher is implicitly wired to actions by convention, and usually doesn't require any custom code. This leaves us with just **stores**, **actions** and **components**. Also, those 3 layers can be used in such a way, that maps nicely into existing **MVC** thought model:
Stores are *Model*, actions are *Controller*, and components are *View*. The main difference is the uni-directional data flow, which means, that controllers(actions) cannot directly modify views(components), but they can just trigger model(store) modifications, to which views are passively bound. This was already a best practice of some [enlightened](http://joelhooks.com/blog/2013/04/24/modeling-data-and-state-in-your-angularjs-application/) Angular developers.

```
     ┌───────────────────────────────────────┐                                
     │                                       │                                
     ▼                                       │                                
 ┌────────┐         ┌───────┐          ┌─────┴─────┐                          
 │ Action │────────▶│ Store │─────────▶│ Component │                          
 └────────┘         └───────┘          └───────────┘                          
```

The workflow is as follows: 
* Components initiate actions
* Stores listen to actions and update data.
* Components are bound to stores and rerender when data are updated

Application is divided to "slices", where each slice roughly corresponds to one page or use case. For each slice, we have it's corresponding actions, stores and components. There can be dependencies between slices. The order in which to describe each slice is usually to start with actions, continue with store, and last (but not least) the components.

#### Login page

When using *alt* flux library, actions generally come in 2 flavors - automatic and manual. Automatic actions are created using the `generateActions` function and they go directly to the dispatcher. Manual methods are defined as methods of your actions class and they can go to dispatcher with additional payload. Most common use case of automatic actions is to just notify stores about some event in the application. Manual actions are, among other thing, the [preffered](http://www.code-experience.com/async-requests-with-react-js-and-flux-revisited/) way of dealing with server interactions. 

So the REST api calls belong to actions. The complete workflow is as follows:
* Component triggers an action
* Action creator runs async server request, and the result goes to dispatcher as payload
* Store listens to action, action handler receives result as an argument, store updates its state accordingly.

For AJAX requests, we use the [axios](https://github.com/mzabriskie/axios) library, which among other things, deals with JSON data and headers seamlessly. Instead of promises or callbacks, we use the ES7 async/await. If the POST response is not 2XX, an error is thrown, and we dispatch either returned data, or received error.

```js
class LoginActions {
  constructor() {
    this.generateActions('logout', 'loadLocalUser');
  }
  async login(data) {
    try {
      const response = await axios.post('/auth/login', data);
      this.dispatch({ok: true, user: response.data});
    } catch (err) {
      console.error(err);
      this.dispatch({ok: false, error: err.data});
    }
  }
  async register(data) {
    try {
      const response = await axios.post('/auth/register', data);
      this.dispatch({ok: true, user: response.data});
    } catch (err) {
      console.error(err);
      this.dispatch({ok: false, error: err.data});
    }
  }
}

module.exports = (alt.createActions(LoginActions));
```

Flux store serves 2 purposes - it has action handlers and state. `LoginStore` has 2 state attributes - `user` for currently logged in user and `error` for current login related error. In the spirit of reducing boilerplate, *alt* allows us to bind to all actions from one class with a single function `bindActions`. 

```js
class LoginStore {
  constructor() {
    this.bindActions(LoginActions);
    this.user = null;
    this.error = null;
  }
```

Handler names are defined by convention prepending `on` to action name, so the `login` actions is handled by `onLogin`, and so forth. Note that the first letter of the action name will be capitalized to preserve camelCase. 

In our `LoginStore` we have following handlers: 

```js
  onLogin(data) {
    this.handleUser(data);
  }
  onRegister(data) {
    this.handleUser(data);
  }
  onLogout() {
    this.clearUser();
    this.redirectToLogin();
  }
  onLoadLocalUser() {
    var user;
    try {
      user = JSON.parse(localStorage.getItem('filmdbUser'));
    } finally {
      user && this.storeUser(user);
    }
  }
```
Handlers `onLogin`, `onRegister` and `onLogout` are triggered by user action, while `onLoadLocalUser` is triggered on application load to get user data from `localStorage`. This is essential, because flux stores are of course cleared with a page refresh, and we need to maintain users session somewhere. Preferably NOT in a cookie, because cookie authentication is not supported with native mobile apps. We want our api device agnostic, right?   

Those handlers make use of following helper methods:

```js
  handleUser(data) {
    if (data.ok) {
      this.storeUser(data.user);
      this.redirectToHome();
    }
    else {
      this.clearUser();
      this.error = data.error.message;
      this.redirectToLogin();
    }
  }
  storeUser(user) {
    this.user = user;
    this.error = null;
    api.updateToken(user.token);
    localStorage.setItem('filmdbUser', JSON.stringify(user));
  }
  clearUser() {
    this.user = null;
    api.updateToken(null);
    localStorage.removeItem('filmdbUser');
  }
  redirectToHome() {
    defer(router.transitionTo.bind(this, 'directors'));
  }
  redirectToLogin() {
    defer(router.transitionTo.bind(this, 'login'));
  }
}

module.exports = (alt.createStore(LoginStore));

```

`handleUser` either calls `storeUser` and redirects to home page, or calls `clearUser`, sets login error and redirects back to login page. As per `storeUser` and `clearUser`, user information needs to be maintained in 3 places - LoginStore state `this.user`, api token in headers, and `localStorage`. Redirects are being called on next tick with `lodash`'s defer as not to violate the [single-dispatch-at-time](https://github.com/goatslacker/alt/issues/71) rule. Now we can proceed to the login screen component. This component uses 2 decorators - `connectToStores` from `alt` to bind the component to stores and our own `changeHandler` to streamline working with inputs, which involves a bit more work without 2-way data-binding.

`connectToStores` expects 2 static methods on our class. Why those methods need to be static? That't because `connectToStores` is a **class** decorator, and it's code needs to execute before we create any instance. 

The first method `getStores` will be called exactly once, and only returns the array of stores to which our component will listen for changes. Listening and un-listening is handled by *alt*.  

The second method `getPropsFromStores` is being called on each store change, and returns an object that will be merged to `this.props`. Under the hood, this happens through wrapping our component into [higher order component](https://github.com/goatslacker/alt/blob/master/src/utils/connectToStores.js).

We also need to define a `login` object on `this.state`, which will serve as a container object for login and password from form inputs. It's a better practice to have related inputs contained in a separate data object than just setting their value directly to `this.state`.

For buttons, we are defining `register` and `login` handlers, which will just pass `this.state.login` object to appropriate action creator.

```js
import {Input, Button, Alert} from 'react-bootstrap';
import connectToStores from 'alt/utils/connectToStores';

@connectToStores
@changeHandler
export default class LoginPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      login: {}
    };
  }
  static getStores() {
    return [LoginStore];
  }
  static getPropsFromStores() {
    return LoginStore.getState();
  }
  register() {
    LoginActions.register(this.state.login);
  }
  login() {
    LoginActions.login(this.state.login);
  }

// Now let's inspect the markup. As we don't want to bother too much witch CSS, we are using the ubiquitous [bootstrap](http://getbootstrap.com/) framework, along with it's [react-bootstrap](http://react-bootstrap.github.io/) counterpart, which reimplements bootstrap's jQuery plugins to native react components.

```
The error sub-component is show only in case of error. This is accomplished in the `render` method by defining the sub-component when error is set, and otherwise leaving undefined. The error subcomponent is inserted into the JSX markup as `{error}`. The `onChange` and `onClick` handlers need to use `bind` to set the context correctly, as methods in ES6 classes are not autobound. 

```js  
  render() {
    var error;
    if (this.props.error) {
      error = <Alert bsStyle="danger">{this.props.error}</Alert>;
    }
    return (
    <div className="container">
      <div className="jumbotron col-centered col-xs-10 col-sm-8 col-md-7 ">
        <h1>FilmDB</h1>
        <p className="lead">Watch This™</p>
        <h2>Login or create account</h2>
        <br/>
        {error}
        <Input
          label='Username'
          type='text'
          value={this.state.login.username}
          onChange={this.changeHandler.bind(this, 'login', 'username')} />
        <Input
          label='Password'
          type='password'
          value={this.state.login.password}
          onChange={this.changeHandler.bind(this, 'login', 'password')} />
        <Button bsStyle="danger" onClick={this.register.bind(this)}>Create account</Button>
        <Button bsStyle="success" className="pull-right" onClick={this.login.bind(this)}>Sign in</Button>
      </div>
    </div>
    );
  }
}

```

The JavaScript's `bind` expression is also used when calling `changeHandler` to define it's first 2 parameters, which are data object `key` on state, and `attr` to which the input's value should be saved. The `changeHandler` decorator just defines the `changeHandler` function on targer class prototype. As an example, when this handler is called with ('login', 'username', 'foo'), it sets `this.state.login.username = 'foo'`. It's quite handy to be able to reuse this code across many components, because it's needed quite often, and not fun to write all over again. 

```js
function changeHandler(target) {
  target.prototype.changeHandler = function(key, attr, event) {
    var state = {};
    state[key] = this.state[key] || {};
    state[key][attr] = event.currentTarget.value;
    this.setState(state);
  };
  return target;
}
```

### API tools

It would be possible to just use *axios* manually all the time, but it often makes sense to encapsulate the api related information into an object, which will make calling actual requests more succint. For this, we are going to use [restful.js](https://github.com/marmelab/restful.js) library, which defines a few common idioms for accessing REST endpoints. I allows us to specify server information, and then define REST collections. On those collections, we can call all 4 HTTP verbs to performs api calls. We can also set the `auth-token` application-wide. From the rest of the application, we are just going to use `api.films`, `api.directors`, and so forth.

```js
import restful from 'restful.js';

const api = {};

if (process.env.BROWSER) {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol.replace(':', '');
  const port = window.location.port;
  const server = restful(hostname)
    .prefixUrl('api')
    .protocol(protocol)
    .port(port);

  api.server = server;
  api.films = server.all('films')
  api.directors = server.all('directors')
  
  api.updateToken = function (token) {
    server.header('auth-token', token);
  };
}

export default api;

```

This setup along with ES7 async/await makes creating actions a breeze:

```js
  async update(id, data) {
    const response = await api.directors.put(id, data);
    this.dispatch(response().data);
  }
```

After I've written a few of those actions, a common pattern emerged. For each network action I needed to implement error handling, and also some status indicator to show to the user that some data are loading. For this, we use `StatusActions` and `StatusStore` that listens to them and sets the state of network requests application-wide. Also, when api responds with `401`, we want to force logout. `StatusActions.failed` comes with additional payload to allow retry functionality when network reconnects, which is neat. 

```js
async function networkAction(context, method, ...params) {
  try {
    StatusActions.started();
    const response = await method.apply(context, params);
    context.dispatch(response().data);
    StatusActions.done();
  } catch (err) {
    console.error(err);
    if (err.status === 401) {
      LoginActions.logout();
    }
    else {
      StatusActions.failed({config: err.config, action: context.actionDetails});
    }
  }
}
```

This function is then reused in action creators to make the definition of api calls super-short:

```js
class FilmsActions {
  get(id) {
    networkAction(this, api.directors.get, id);
  }
  add(data) {
    networkAction(this, api.directors.post, data);
  }
  update(id, data) {
    networkAction(this, api.directors.put, id, data);
  }
}
```

#### Network status handling 

All status actions are automatic, because they don't need to do any other stuff than just deliver update to the `StatusStore`.

```js
class StatusActions {
  constructor() {
    this.generateActions('started', 'done', 'failed', 'retry');
  }
}

module.exports = (alt.createActions(StatusActions));
```

The `StatusStore` holds the information about current network request status, whether the netowrk is `busy` and if there were an `error`. Action handlers set those according to the request state. The interesting part is the `onRetry` handler, which uses the information from `failed` action, and retries it using `axios`. Here we also have the rare opportunity to use *alt* dispatcher directly, because we are not inside an action - we are dispatching whatever action previously failed. On this example we see that the Convention Over Configuration approach that *alt* uses does not sacrifice flexibility. A common misconception indeed.

```js
class StatusStore {
  constructor() {
    this.bindActions(StatusActions);
    this.busy = false;
    this.error = false;
  }
  onStarted() {
    this.busy = true;
    this.error = false;
  }
  onDone() {
    this.busy = false;
    this.error = false;
  }
  onFailed(retryData) {
    this.busy = false;
    this.error = true;
    this.retryData = retryData;
  }
  async onRetry() {
    const response = await axios(this.retryData.config);
    var data = response.data;
    alt.dispatch(this.retryData.action.symbol, data, this.retryData.action);
    StatusActions.done();
  }
}

module.exports = (alt.createStore(StatusStore));
```

#### Navbar

We are now ready to fully exploit the network status information in the `Navbar`. Aside from the usual components from `react-bootstrap`, we are also using the `Link` component from `react-router`, which allows us to specify routes using their router names instead of url. Using urls directly is sometimes considered a bad practice. To make the matter even easier for a lazy person, we've also included `NavItemLink` from `react-router-bootstrap`, which takes care of automatically setting the `active` class on currently active route. 

Navbar also includes 3 optional sub-components. `errorComponent` is an alert shown when there's an error, `busyComponent` is a spinner and `retryComponent` is a button that will trigger the `retry` action.

```js
import {Link} from 'react-router';
import {NavItemLink} from 'react-router-bootstrap';
import {Alert, Button} from 'react-bootstrap';

@connectToStores
export default class Navbar extends React.Component {
  static getStores() {
    return [StatusStore];
  }
  static getPropsFromStores() {
    return StatusStore.getState();
  }
  retry() {
    StatusActions.retry();
  }
  logout() {
    LoginActions.logout();
  }
  render() {
    var errorComponent;
    var retryComponent;
    var busyComponent;
    if (this.props.error) {
      if (this.props.retryData) {
        retryComponent = <Button onClick={this.retry} bsStyle="danger" bsSize="xsmall" className="pull-right">Retry</Button>;
      }
      errorComponent = (
      <Alert bsStyle='danger'>
      <strong>Network Error!</strong>
      {retryComponent}
      </Alert>);
    }
    if (this.props.busy) {
      busyComponent = <div className="busy-indicator pull-right"><i className="fa fa-refresh fa-spin"></i></div>;
    }
    return (
      <div>
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <Link to='app' className="navbar-brand">
                <i className="fa fa-film"></i> FilmDB
              </Link>
            </div>
            <ul className="nav navbar-nav">
              <li>
                <NavItemLink to='directors'>Directors</NavItemLink>
              </li>
              <li>
                <NavItemLink to='films'>Films</NavItemLink>
              </li>
            </ul>
            <ul className="nav navbar-nav pull-right">
              <li onClick={this.logout.bind(this)}>
                <a href="#">Logout</a>
              </li>
            </ul>
            {busyComponent}
          </div>
        </nav>
        {errorComponent}
      </div>
    );
  }
}
```

#### Directors

It is interesting, how much effort it takes in a modern single page application before one gets to the actual content. The `Directors` "slice" is about CRUD operations on a collection of directors. 

The `DirectorsActions` are quite self-explaining. Notice that the `data` argument needs to be cloned for `add` and `update` actions. That is because of the **retry** functionality introduced earlier. If we didn't clone the object and just passed it by reference, it would later get overwritten. 

actions
```js
import {clone} from 'lodash';

class DirectorsActions {
  fetch() {
    networkAction(this, api.directors.getAll);
  }
  add(data) {
    networkAction(this, api.directors.post, clone(data));
  }
  update(id, data) {
    networkAction(this, api.directors.put, id, clone(data));
  }
  delete(id) {
    networkAction(this, api.directors.delete, id);
  }
}

module.exports = (alt.createActions(DirectorsActions));
```

The `DirectorsStore` stores data from above actions, but also needs to do some processing. When we fetch the collection from api, we then store it in `this.directors`. But we also need to create `directorsHash`, which will be used by `Films` page to fill in director data for the **1:N** relation. Film objects store only director's `_id`, and in would be inefficient to fetch director objects from database for each displayed film extra. There's a library [normalizr](https://github.com/gaearon/normalizr) that expands a bit on this approach, but for us one hash is sufficient. We are using functional approach to creating this hash. The reduce function keeps the first parameter, initialized with `{}` over all iterations, and all items of the `directors` array are stored under their `_id`s. 

In some applications it is possible to handle adding, updating or deleting items by reloading whole collection from server afterwards, but that would go against the flux store philosophy, and would have worse performance of course. Adding is easy - just push the newly saved item to the end of the collection (at least in our use case). For updating and deleting, we need to identify which ite in out collection to update/delete depending on the **id** of the element returned from action. 

```js
import {assign} from 'lodash';
import {findItemById, findIndexById} from 'utils/store-utils';

class DirectorsStore {
  constructor() {
    this.bindActions(DirectorsActions);
    this.directors = [];
    this.directorsHash = {};
  }
  onAdd(item) {
    this.directors.push(item);
  }
  onFetch(directors) {
    this.directors = directors;
    this.directorsHash = this.directors.reduce((hash, item) => {
      hash[item._id] = item;
      return hash;
    }, {});
  }
  onUpdate(item) {
    assign(findItemById(this.directors, item._id), item);
  }
  onDelete(item) {
    this.directors.splice(findIndexById(this.directors, item._id), 1);
  }
}

module.exports = (alt.createStore(DirectorsStore));

```

For this task of finding an element (or it's index) by id we've created two helper methods. Curiously, returning the whole element is a bit easier than it's index. Of course, `array.indexOf` is not an option, because the object just returned from api is not the same instance.

```js
function findItemById (collection, id) {
  return collection.find(x => x._id === id);
}
function findIndexById(collection, id) {
    var index;
    collection.find((x, i) => {
      index = i;
      return x._id === id;
    });
    return index;
  }
}
```

Before we start with the component, we are going to need yet another decorator - this time for authentication:
```js
function requireUser(target) {
  target.willTransitionTo = function(transition) {
    if (!localStorage.filmdbUser) {
      transition.redirect('/login');
    }
  };
  return target;
}
```

The static method `willTransitionTo` is being used by `react-router` to optionaly redirect before the route is changed. We are checking for user in `localStorage`, and redirect to login if it's not present. Of course it would be possible to add some additional security features, but failed api call is going to redirect as well, so for now we are safe enough. It might be also cleaner to check for the user in LoginStore, but `willTransitionTo` happens so early in the application lifecycle that the `loadLocalUser` action is not finished yet. I'm waiting for suggestions how to fix this properly.  

```js
import {ModalTrigger, Button} from 'react-bootstrap';
import moment from 'moment';

@requireUser
@connectToStores
export default class DirectorsTable extends React.Component {
  static getStores() {
    return [DirectorsStore];
  }
  static getPropsFromStores() {
    return DirectorsStore.getState();
  }
```
After defining the `connectToStores` dependencies, we are going to call `fetch` action in constructor to load data from api. The workflow is as usual - fetch data in action, store listen and updates it's state, this component is bound to the store state, so the change triggers re-render.

```js  
  constructor(props) {
    super(props);
    this.state = {};
    DirectorsActions.fetch();
  }
  add() {
    this.refs.modalTrigger.props.modal.props.editItem = null;
    this.refs.modalTrigger.show();
  }
```

We have only one action handler on this page, and that is for the **Add** button to show the modal with the edit form. Form is used for editing as well, so we need to clear the `editItem`. 

```js
  render() {
    return (
      <div className="container-fluid">
        <h1>Directors</h1>
        <ModalTrigger
          ref="modalTrigger"
          modal={<DirectorForm />}>
          <span/>
        </ModalTrigger>
        <Button bsStyle="primary" bsSize="large" onClick={this.add.bind(this)}>Add new director</Button>
        <br/>
        <table className="table table-striped item-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Nationality</th>
              <th>Birthday</th>
              <th>Biography</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
```
Iterating over array of directors to render the table lines is accomplished using the `map` function. We are just inlining an array of JSX components. Actually, it feels much better to use plain JS for iteration instead of having to devise specialized templating language.
```js
            {this.props.directors && this.props.directors.map((item, index) =>
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.nationality}</td>
              <td>{moment(item.birthday).format('D MMMM YYYY')}</td>
              <td className="ellipsis">{item.biography}</td>
              <td>
```
For row actions, we have a special component `ActionBar` that is shared among multiple tables. It's being passed some rather assorted properties, but it works for this use case. Current `item` object, the `deleteAction` to call on **delete** click, and the `modalTrigger` to be called on **edit** click.
```js              
                <ActionBar
                  item={item}
                  deleteAction={DirectorsActions.delete}
                  modalTrigger={this.refs.modalTrigger}/>
              </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

```

It's very easy to create components in React, and so you are encouraged to create as many of them as possible, and keep them small. Even a set of 2 buttons is worth its own component. As for functionality, on **delete** click we just execute the `deleteAction` passed in props and on **edit** we are setting the item into "modalTrigger's modal's" `editItem` property. 

```js
export default class ActionBar extends React.Component {
  delete() {
    this.props.deleteAction(this.props.item._id);
  }
  edit() {
    this.props.modalTrigger.props.modal.props.editItem = this.props.item;
    this.props.modalTrigger.show();
  }
  render() {
    return (
      <div className="action">
        <span className="action-buttons">
          <Button
            bsStyle="warning"
            bsSize="xsmall"
            onClick={this.edit.bind(this)}>Edit</Button>
          <Button
            bsStyle="danger"
            bsSize="xsmall"
            onClick={this.delete.bind(this)}>Delete</Button>
        </span>
      </div>
    );
  }
}

```

And finally, we are getting to the `DirectorForm` component. Working with forms can be tedious, so let's get some help from the [formsy-react](https://github.com/christianalfoni/formsy-react) library, which will help us with managing validations and data model.  

```js
import Formsy from 'formsy-react';

export default class DirectorForm extends React.Component {
  constructor(props) {
    super(props);
    // Convert birthday to Date object to allow editing
    if (this.props.editItem) {
      this.props.editItem.birthday = new Date(this.props.editItem.birthday);
    }
    this.refs.directorForm.reset(this.props.editItem);
  }
  submit(model) {
    if (this.props.editItem) {
      DirectorsActions.update(this.props.editItem._id, model);
    }
    else {
      DirectorsActions.add(model);
    }
    this.refs.directorForm.reset();
    // React complains if we update
    // DOM with form validations after close
    // so let's wait one tick
    defer(this.close.bind(this));
  }
  close() {
    this.props.onRequestHide();
  }
  send() {
    this.refs.directorForm.submit();
  }


  render() {
    var title;
    var send;
    var nameError = 'Must have at least 2 letters';
    var textError = 'Must have at least 10 letters';
    var nationError = 'Nationality must be selected';
    if (this.props.editItem) {
      title = 'Edit director ' + this.props.editItem.name;
      send = 'Update';
    }
    else {
      title = 'Add new director';
      send = 'Create';
    }
    return (
      <Modal {...this.props} ref="modalInstance" title={title} animation={false}>
        <div className='modal-body'>
          <Formsy.Form ref="directorForm" onValidSubmit={this.submit.bind(this)}>
            <BootstrapInput
              name="name"
              title="Name"
              type="text"
              validations="minLength:2"
              validationError={nameError}/>
            <SelectInput
              name="nationality"
              title="Nationality"
              options={countries.options}
              validations="minLength:1"
              validationError={nationError}/>
            <PikadayInput
              name="birthday"
              title="Birthday"
              type="text"
              validationError={nameError}/>
            <BootstrapInput
              name="biography"
              title="Biography"
              type="textarea"
              validations="minLength:10"
              validationError={textError}/>
          </Formsy.Form>
        </div>
        <div className='modal-footer'>
          <Button className="pull-left" ref="closeButton" onClick={this.close.bind(this)}>Cancel</Button>
          <Button bsStyle="success" type="submit" onClick={this.send.bind(this)}>{send}</Button>
        </div>
      </Modal>
    );
  }
}

```













