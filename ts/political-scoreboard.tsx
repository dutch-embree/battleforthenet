import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';

import {EventEmitter} from './event-emitter';
import {Carousel} from './carousel';
import {ajaxResult, ajaxPromise} from './utils';
import {handleInputChange} from './utils';
import {clamp, classes} from './utils';
import {r} from './r';


function getPoliticianSubdomain(p:any): string {
	var subdomain: string;
	if (p.subdomain) {
		subdomain = p.subdomain;
	} else {
		subdomain = p.first + p.name;
	}
	var host = (p.team == "team-internet") ? ".savesthe.net" : ".breaksthe.net";
	return "http://" + subdomain + host;
}

function getPoliticianTweetLink(p:any): string {
	var shareText: string;
	var domain: string = p.site.toLowerCase();
	if (p.sharetext) {
		shareText = encodeURIComponent(p.sharetext);
	} else if (p.team == 'team-internet') {
		shareText = encodeURIComponent("Can @" + p.twitter + " save Net Neutrality? Stop HR 2666! See " + domain + " and battleforthe.net. https://pic.twitter.com/r6V33Ileya");
	} else {
		shareText = encodeURIComponent("Don't let @" + p.twitter + " gut Net Neutrality! Stop HR 2666! See " + domain + " and battleforthe.net. https://pic.twitter.com/r6V33Ileya");
	}
	return "https://twitter.com/intent/tweet?text=" + shareText + "&related=fightfortheftr";
}


function parsePolitician(data:any, idx:number) {
  var imageBaseURL = '/images/scoreboard/';
	var ret:any = {
		idx: idx,
		frontpage: (data.gsx$frontpage.$t === '1'),
		first: data.gsx$first.$t,
		name: data.gsx$name.$t,
		organization: data.gsx$organization.$t,
		image: imageBaseURL + data.gsx$imagepleasedontedit.$t,
		weight: data.gsx$weight.$t,
		team: data.gsx$team.$t || 'undecided',
		size: data.gsx$size.$t,
		meta: data.gsx$meta.$t,
		twitter: data.gsx$twitter.$t,
		sharetext: data.gsx$sharetext.$t,
		subdomain: data.gsx$subdomain.$t,
		state: data.gsx$state.$t,
		tweetLink: null
	};
	ret["site"] = getPoliticianSubdomain(ret);
	if (ret.twitter) {
		ret["tweetLink"] = getPoliticianTweetLink(ret);
	}
	return ret as Politician;
}

interface Politician {
	idx: number
	frontpage: boolean
	first: string
	name: string
	organization: string
	image: string
	weight: string
	team: string
	size: string
	meta: string
	twitter: string | null
	sharetext: string
	subdomain: string
	site: string
	state: string
	tweetLink: string | null
}

interface PoliticiansSet {
	undecided: Politician[]
	cable: Politician[]
	internet: Politician[]
}

var teamMapper: any = {
	"undecided": "undecided",
	"team-cable": "cable",
	"team-internet": "internet"
}


function getPoliticians(): Promise<PoliticiansSet> {
	return ajaxPromise({
		url: "https://cache.battleforthenet.com/politicians.json",
		method: "get",
		json: true
	}).then(function(response: Response) {
		if (response.ok) {
			return response.json();
		} else {
			throw new Error("Bad response");
		}
	}).then(function(j: any) {
		var ret: PoliticiansSet = {
			"undecided": [],
			"cable": [],
			"internet": []
		};
		_.each(j.feed.entry, function(p, idx) {
			var politician = parsePolitician(p, parseInt(idx, 10));
			var team = teamMapper[politician.team];
			if (team) {
				(ret as any)[team].push(politician);
			}
		});
		return ret;
	});
}

interface Props {
	eventEmitter: EventEmitter
}

interface State {
	politiciansSet: PoliticiansSet | null
	state: string | null
	error: string | null
}


export class PoliticalScoreboard extends React.Component<Props, State> {
	constructor(props:Props) {
		super(props);
		this.state = {
			politiciansSet: null,
			state: null,
			error: null
		};
	}
	componentDidMount() {
		getPoliticians().then((politiciansSet:PoliticiansSet)=> {
			this.setState({
				politiciansSet: politiciansSet
			} as State);
		});
	}
	renderPolitician(politician:Politician) {
		return (
			<div key={"p-" + politician.idx} className="politician">
				<img src={ politician.image } />
				<div className="cover">
					<span>{politician.organization}</span>
				</div>
				<div className="actions">
					{ politician.twitter ? <a className="btn tweet" href={politician.tweetLink as string}>Tweet</a> : null }
					<a className="btn site" href={politician.site}>Visit Site</a>
				</div>
			</div>
		);
	}
	renderStateOption(state: string) {
		return <option key={state} value={state}>{state}</option>
	}
	onSelectState(evt:Event) {
		evt.preventDefault();
	}
	renderContent(politiciansSet:PoliticiansSet, state: string|null) {
		var filterState = function(set:Politician[], state:string|null): Politician[] {
			console.log(state);
			if (state === null || !state) {
				return set;
			}
			return _.filter(set, (p) => {
				return p.state === state;
			});
		};
		var undecided = filterState(politiciansSet.undecided, state);
		var cable = filterState(politiciansSet.cable, state);
		var internet = filterState(politiciansSet.internet, state);
		var renderItem = this.renderPolitician.bind(this);
		return (
			<div>
				<div className="state-selector unit">
					Choose your state:
					<select name="state" value={state || ""} onChange={handleInputChange.bind(this)}>
						<option key="null" value="">Select state</option>
						{_.map(r.states, this.renderStateOption)}
					</select>
				</div>

				{ undecided.length ?
					<div className="psb-section psb-unknown">
						<div className="unit">
							<h4>Unknown:</h4>
							<p>They haven't come out against Pai's plan yet. We need you to tweet them.</p>
						</div>
						<Carousel items={undecided} width={100} height={120} padding={10} pagePadding={30} eventEmitter={this.props.eventEmitter} renderItem={renderItem} />
					</div> : null }

				{ cable.length ?
					<div className="psb-section psb-cable">
						<div className="unit">
							<h4>Team Cable:</h4>
							<p>They are for Pai's plan. We need you to tweet them.</p>
						</div>
						<Carousel items={cable} width={100} height={120} padding={10} pagePadding={30} eventEmitter={this.props.eventEmitter} renderItem={renderItem} />
					</div> : null }

				{ internet.length ?
					<div className="psb-section psb-internet">
						<div className="unit">
							<h4>Team Internet:</h4>
							<p>They have come out against Pai's plan. Show them your support.</p>
						</div>
						<Carousel items={internet} width={100} height={120} padding={10} pagePadding={30} eventEmitter={this.props.eventEmitter} renderItem={renderItem} />
					</div> : null }
			</div>
		);
	}
	render() {
		var content: JSX.Element|null = null;
		if (this.state.politiciansSet) {
			content = this.renderContent(this.state.politiciansSet, this.state.state);
		}
		return (
			<div className="political-scoreboard">
				{ content }
			</div>
		);
	}
}
