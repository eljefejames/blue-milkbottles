import alt from '../libs/alt';
import KanbanActions from '../actions/KanbanActions'

class KanbanStore {
  constructor() {
    this.bindActions(KanbanActions);
    this.kanbeezy = [];
  }
testMe() {
console.log("flowing ok");
this.setState({
  kanbeezy: "yes"
})}
}


export default alt.createStore(KanbanStore, 'KanbanStore');
