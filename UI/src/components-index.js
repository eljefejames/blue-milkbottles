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
    EventDisplays: {
        EventPanel: require('./components/EventDisplays/EventPanel.js'),
        EventListingTable: require('./components/EventDisplays/EventListingTable.js')
    }
};
module.exports = Bootstrap;