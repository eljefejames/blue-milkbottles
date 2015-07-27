import React from 'react';
import Notes from './Notes';
import NoteActions from '../actions/NoteActions';
import NoteStore from '../stores/NoteStore';
import persist from '../decorators/persist';
import storage from '../libs/storage';
import connect from '../decorators/connect';

const noteStorageName = 'notes';

@persist(storage, noteStorageName, () => NoteStore.getState())
@connect(NoteStore)


export default class App extends React.Component {
  constructor(props) {
    notes: Array;
  }) {
   super(props);

this.addItem = this.addItem.bind(this);
this.itemEdited = this.itemEdited.bind(this);

this.storeChanged = this.storeChanged.bind(this);

NoteActions.init(storage.get(noteStorageName));
this.state = NoteStore.getState();
}
/*

The addition of the Connect decorators allows to remove to the mounting bits
componentDidMount() {
   NoteStore.listen(this.storeChanged);
 }
 componentWillUnmount() {
   NoteStore.unlisten(this.storeChanged);
 }
 storeChanged(state) {
   this.setState(NoteStore.getState());
 }
 */

  render() {
    var notes = this.state.notes;

    return (
      <div>
       <button onClick={this.addItem}>+</button>
       <Notes items={notes} onEdit={this.itemEdited} />
     </div>
    );
  }


addItem() {
  NoteActions.create('New Task');
}

itemEdited(id, task) {
  if (task) {
    NoteActions.update({id, task});
  }
  else {
    NoteActions.remove(id);
  }
}
}
export default persist(
  connect(App, NoteStore),
  storage,
  noteStorageName,
  () => NoteStore.getState()
);
