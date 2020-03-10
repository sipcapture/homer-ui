import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges } from '@angular/core';
export class DonutChartDatum {
  code: string;
  displayValue: string;
  count: number;
}
/** @todo modify the color range array with the settings of the widget */
import * as d3 from 'd3';

@Component({
  selector: 'app-d3-pie-chart',
  templateUrl: './d3-pie-chart.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./d3-pie-chart.component.scss']
})
export class D3PieChartComponent implements OnInit, OnChanges {

  @Input() data: number[];
  hostElement; // Native element hosting the SVG container
  svg; // Top level SVG element
  g; // SVG Group element
  arc; // D3 Arc generator
  innerRadius; // Inner radius of donut chart
  radius; // Outer radius of donut chart
  slices; // Donut chart slice elements
  labels; // SVG data label elements
  totalLabel; // SVG label for total
  rawData; // Raw chart values array
  total: number; // Total of chart values
  colorScale; // D3 color provider
  pieData: any; // Arc segment parameters for current data set
  pieDataPrevious: any; // Arc segment parameters for previous data set - used for transitions
  colors = d3.scaleOrdinal(d3.schemeCategory10);

  // Pie function - transforms raw data to arc segment parameters
  pie = d3.pie()
      .startAngle(-0.5 * Math.PI)
      .endAngle(0.5 * Math.PI)
      .sort(null)
      .value((d: number) => d);

  constructor(private elRef: ElementRef) {
      this.hostElement = this.elRef.nativeElement;
  }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
      if (changes.data) {
          this.updateChart(changes.data.currentValue);
      }
  }

  private createChart(data: number[]) {

      this.processPieData(data);

      this.removeExistingChartFromParent();

      this.setChartDimensions();

      this.setColorScale();

      this.addGraphicsElement();

      this.setupArcGenerator();

      this.addSlicesToTheDonut();

      this.addLabelsToTheDonut();

      this.addDonutTotalLabel();
  }


  private setChartDimensions() {
      let viewBoxHeight = 100;
      let viewBoxWidth = 200;
      this.svg = d3.select(this.hostElement).append('svg')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('viewBox', '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight);
  }

  private addGraphicsElement() {
      this.g = this.svg.append("g")
          .attr("transform", "translate(100,90)");
  }

  private setColorScale() {
      this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
      // Below is an example of using custom colors
     // this.colorScale = d3.scaleOrdinal().domain([])
     this.colorScale = d3.scaleOrdinal().domain(['0','1','2','3','4','5','6']).range(['#99cc33', '#66cccc', '#009999', '#cc3366','#ff9933','#ff3333',' ']);
  }

  private processPieData(data, initial = true) {
      this.rawData = data;
      this.total = this.rawData.reduce((sum, next) => sum + next, 0);

      this.pieData = this.pie(data);
      if (initial) {
          this.pieDataPrevious = this.pieData;
      }
  }


  private setupArcGenerator() {
      this.innerRadius = 50;
      this.radius = 80;
      this.arc = d3.arc()
          .innerRadius(this.innerRadius)
          .outerRadius(this.radius);
  }

  private addSlicesToTheDonut() {
      this.slices = this.g.selectAll('allSlices')
          .data(this.pieData)
          .enter()
          .append('path')
          .attr('d', this.arc)
          .attr('fill', (datum, index) => {
              return this.colorScale(`${index}`);
          })
          .style('opacity', 1);
  }

  private addDonutTotalLabel() {
      this.totalLabel = this.svg
          .append('text')
          .text('Total: ' + this.total)
          .attr('id', 'total')
          .attr('x', 100)
          .attr('y', 80)
          .style('font-size', '10px')
          .style('text-anchor', 'middle');
  }

  // Creates an "interpolator" for animated transition for arc slices
  //   given previous and new arc shapes,
  //   generates a series of arc shapes (be)tween start and end state
  arcTween = (datum, index) => {
      const interpolation = d3.interpolate(this.pieDataPrevious[index], datum);
      this.pieDataPrevious[index] = interpolation(0);
      return (t) => {
          return this.arc(interpolation(t));
      }
  }

  // Creates an "interpolator" for animated transition for arc labels
  //   given previous and new label positions,
  //   generates a series of arc states (be)tween start and end state
  labelTween = (datum, index) => {
      const interpolation = d3.interpolate(this.pieDataPrevious[index], datum);
      this.pieDataPrevious[index] = interpolation(0);
      return (t) => {
          return 'translate(' + this.arc.centroid(interpolation(t)) + ')';
      }
  }

  public updateChart(data: number[]) {
      if (!this.svg) {
          this.createChart(data);
          return;
      }

      this.processPieData(data, false);

      this.updateSlices();

      this.updateLabels();

  }

  private updateSlices() {
      this.slices = this.slices.data(this.pieData);
      this.slices.transition().duration(750).attrTween("d", this.arcTween);
  }

  private updateLabels() {
      this.totalLabel.text(this.total);
      this.labels.data(this.pieData);
      this.labels.each((datum, index, n) => {
          d3.select(n[index]).text(this.labelValueFn(this.rawData[index]));
      });
      this.labels.transition().duration(750).attrTween("transform", this.labelTween);
  }

  private updateTotal() {
      this.totalLabel.text(this.total);
  }

  private removeExistingChartFromParent() {
      // !!!!Caution!!!
      // Make sure not to do;
      //     d3.select('svg').remove();
      // That will clear all other SVG elements in the DOM
      d3.select(this.hostElement).select('svg').remove();
  }

  private addLabelsToTheDonut() {
      this.labels = this.g
          .selectAll('allLabels')
          .data(this.pieData)
          .enter()
          .append('text')
          .text(this.labelValueGetter)
          .attr('transform', (datum, index) => {
              return 'translate(' + this.arc.centroid(datum) + ')';
          })
          .style('font-size', '8px')
          .style('text-anchor', 'middle');

  }

  private labelValueGetter = (datum, index) => {
      return this.labelValueFn(this.rawData[index]);
  }

  private labelValueFn(val) {
      const pct = Math.floor(val * 100 / this.total);
      return (pct < 4) ? '' : '' + val;
  }

}
