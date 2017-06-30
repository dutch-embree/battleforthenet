import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';


interface Politician {
}

interface Props {
}

interface State {
	politicians: Politician[] | null
	state: string | null
}

export class PoliticalScoreboard extends React.Component<Props, State> {
	constructor(props:Props) {
		super(props);
		this.state = {
			politicians: null,
			state: null
		};
	}
	render() {
		return (
			<div className="political-scoreboard">
				<div className="state-selector">
					Choose your state:
					<select>
					</select>
				</div>

				<div className="psb-section psb-unknown">
					<h3>Unknown:</h3>
					<p>They haven't come out against Pai's plan yet. We need you to tweet them.</p>
				</div>

				<div className="psb-section psb-cable">
					<h3>Team Cable:</h3>
					<p>They are for Pai's plan. We need you to tweet them.</p>
				</div>

				<div className="psb-section psb-internet">
					<h3>Team Internet:</h3>
					<p>They have come out against Pai's plan. Show them your support.</p>
				</div>
			</div>
		);
	}
}
