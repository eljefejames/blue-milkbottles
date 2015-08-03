import uuid from 'node-uuid';
import AltContainer from 'alt/AltContainer';
import React from 'react';
import Lanes from './Lanes';
import LaneActions from '../actions/LaneActions';
import LaneStore from '../stores/LaneStore';
import KanbanActions from '../actions/KanbanActions'
import KanbanStore from '../stores/KanbanStore'

export default class App extends React.Component {
  render() {
    return (
      <div>
        <button onClick={this.addItem}>+</button>
        <AltContainer
          stores={[LaneStore]}
          inject={ {
            items: () => LaneStore.getState().lanes || []
          } }
        >
          <Lanes />
        </AltContainer>
        <button id= "123" onClick={this.sayHello}>Take a screenshot</button>
        <button id= "234" onClick={this.testMe}>Test news</button>
      </div>
    );
  }
  addItem() {
    LaneActions.create({id: uuid.v4(), name: 'New Lane'});
  }
  sayHello() {
    LaneActions.hello();
  }
}
