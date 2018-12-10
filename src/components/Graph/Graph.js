import './Graph.css';
import React, { PureComponent } from 'react';
import * as utils from '../../utils';

const POINTS_COUNT = 7;

export default class Graph extends PureComponent {
  constructor(props) {
    super(props);

    const stats = this.props.stats;

    this.points = [];
    this.maxPoint = 0;
    for (let i = 0; i < stats.length; i++) {
      this.points.push(stats[i].total);

      if (stats[i].total > this.maxPoint) {
        this.maxPoint = stats[i].total;
      }
    }

    let width = window.innerWidth - 30 * 2;
    if (window.isDesktop) {
      width -= 240;
    }
    this.width = width;
    this.xStep = width / (POINTS_COUNT - 1);
    this.height = 100;
  }

  render() {
    return (
      <div className="Graph">
        <div className="Graph__cont">
          <svg width={this.width} height={this.height}>
            {this._renderLine()}
          </svg>
          {this._renderSeparators()}
          {this._renderPoints()}
          {this._renderTouchZones()}
        </div>
      </div>
    )
  }

  _renderLine() {
    return new Array(POINTS_COUNT - 1).fill(1, 0, POINTS_COUNT - 1).map((_, i) => {
      const data = this._calcPointData(i);
      const nextData = this._calcPointData(i + 1);
      const prevData = i > 0 ? this._calcPointData(i - 1) : false;

      const lineEndX = this.xStep;
      const lineEndY = nextData.startY - data.startY;

      const x1 = 34;
      let y1;
      if (data.startY === nextData.startY) {
        y1 = 0;
      } else {
        if (prevData) {
          y1 = prevData.startY - data.startY;
        } else {
          y1 = data.startY < nextData.startY ? 4 : -4;
        }
      }

      const x2 = 41;
      const y2 = lineEndY;

      return (
        <path
          key={i}
          strokeWidth={2}
          fill="none"
          d={`M ${data.startX}, ${data.startY} c ${x1},${y1} ${x2},${y2} ${lineEndX},${lineEndY}`}
          />
      )
    });
  }

  _calcPointData(index) {
    const point = this.points[index];
    const pointPercent = (point / this.maxPoint * 100) || 0;

    return {
      startX: this.xStep * index,
      startY: (100 - pointPercent) / 100 * this.height * 0.7 + 20
    };
  }

  _renderSeparators() {
    return new Array(POINTS_COUNT).fill(1, 0, POINTS_COUNT).map((_, i) => {
      const className = utils.classNames({
        Graph__separator: true,
        active: i === this.props.selected
      });

      const left = i / (POINTS_COUNT - 1) * 100;
      return (
        <div
          key={`sep${i}`}
          className={className}
          style={{left: `${left}%`}}
        />
      )
    });
  }

  _renderPoints() {
    return new Array(POINTS_COUNT).fill(1, 0, POINTS_COUNT).map((_, i) => {
      const left = i / (POINTS_COUNT - 1) * 100;
      const top = this._calcPointData(i).startY;

      const className = utils.classNames({
        Graph__point: true,
        active: i === this.props.selected
      });

      return (
        <div
          key={`point${i}`}
          className={className}
          style={{left: `${left}%`, top: `${top}px`}}
        />
      )
    });
  }

  _renderTouchZones() {
    return new Array(POINTS_COUNT).fill(1, 0, POINTS_COUNT).map((_, i) => {
      const className = utils.classNames({
        ['Graph__touch-zone']: true,
        active: i === this.props.selected
      });

      const left = i / (POINTS_COUNT - 1) * 100;
      const data = this.props.stats[i];
      return (
        <div
          key={`touch${i}`}
          className={className}
          style={{left: `${left}%`}}
          onClick={() => this._zoneDidPress(i)}
        >
          <div className="Graph__day">{data.day}</div>
        </div>
      )
    });
  }

  _zoneDidPress = (index) => {
    this.setState({selected: index});
    this.props.onChange && this.props.onChange(index);
  };
}