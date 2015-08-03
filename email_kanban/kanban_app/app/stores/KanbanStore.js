import alt from '../libs/alt';
import KanbanActions from '../actions/KanbanActions'

class KanbanStore {
  constructor() {
    this.bindActions(KanbanActions);

    this.kanban = this.kanban || [];
  }
testMe() {
console.log("flowing ok");
}
}
