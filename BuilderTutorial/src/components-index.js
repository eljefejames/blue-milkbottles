require('./assets/css/bootstrap.min.css');
require('./assets/css/font-awesome.min.css');
var ReactBootstrap = require('react-bootstrap');
var Bootstrap = {
    ReactBootstrap: {
        Grid: ReactBootstrap.Grid,
        Row: ReactBootstrap.Row,
        Col: ReactBootstrap.Col,
        ButtonToolbar: ReactBootstrap.ButtonToolbar,
        ButtonGroup: ReactBootstrap.ButtonGroup,
        Button: ReactBootstrap.Button,
        DropdownButton: ReactBootstrap.DropdownButton,
        SplitButton: ReactBootstrap.SplitButton,
        MenuItem: ReactBootstrap.MenuItem,
        Panel: ReactBootstrap.Panel,
        PanelGroup: require('./components/ReactBootstrap/PanelGroup.js'),
        Input: ReactBootstrap.Input,
        Table: ReactBootstrap.Table,
        TabbedArea: require('./components/ReactBootstrap/TabbedArea.js'),
        TabPane: ReactBootstrap.TabPane,
        Carousel: ReactBootstrap.Carousel,
        CarouselItem: ReactBootstrap.CarouselItem,
        ProgressBar: ReactBootstrap.ProgressBar,
        Navbar: ReactBootstrap.Navbar,
        Nav: require('./components/ReactBootstrap/Nav.js'),
        NavItem: ReactBootstrap.NavItem,
        ListGroup: ReactBootstrap.ListGroup,
        ListGroupItem: ReactBootstrap.ListGroupItem,
        Label: ReactBootstrap.Label,
        Badge: ReactBootstrap.Badge
    },
    Enhanced: { LoadingButton: require('./components/Enhanced/LoadingButton.js') },
    Tutorial: {
        CommentForm: require('./components/Tutorial/CommentForm.js'),
        CommentList: require('./components/Tutorial/CommentList.js'),
        Comment: require('./components/Tutorial/Comment.js')
    }
};
module.exports = Bootstrap;