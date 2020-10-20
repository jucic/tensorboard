/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

import {Coordinator} from '../coordinator';
import {SvgRenderer} from '../renderer/svg_renderer';
import {DataDrawable, Drawable, DrawableConfig} from './drawable';
import {FlexLayout} from './flex_layout';
import {RootLayout} from './root_layout';

class TestableDrawable extends Drawable {
  redraw(): void {}
}

class TestableDataDrawable extends DataDrawable {
  redraw(): void {}
  getSeriesData() {
    return this.series;
  }
}

describe('line_chart_v2/lib/layout integration test', () => {
  let option: DrawableConfig;
  beforeEach(() => {
    option = {
      container: document.body,
      coordinator: new Coordinator(),
      renderer: new SvgRenderer(
        document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      ),
      metadataMap: {},
    };
  });

  describe('layout', () => {
    it('lays out descendant layouts correctly', () => {
      const layouts = new RootLayout(
        option,
        [
          [
            new TestableDrawable(option),
            new FlexLayout(option, [
              [new FlexLayout(option), new FlexLayout(option)],
            ]),
          ],
          [new FlexLayout(option), new TestableDataDrawable(option)],
        ],
        {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        }
      );

      const [row1, row2] = layouts.getContentGrid();
      expect(row1[0].getLayoutRect()).toEqual({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });
      expect(row1[1].getLayoutRect()).toEqual({
        x: 50,
        y: 0,
        width: 50,
        height: 50,
      });
      expect(row1[1].getContentGrid()[0][0].getLayoutRect()).toEqual({
        x: 50,
        y: 0,
        width: 25,
        height: 50,
      });
      expect(row1[1].getContentGrid()[0][1].getLayoutRect()).toEqual({
        x: 75,
        y: 0,
        width: 25,
        height: 50,
      });
      expect(row2[0].getLayoutRect()).toEqual({
        x: 0,
        y: 50,
        width: 50,
        height: 50,
      });
      expect(row2[1].getLayoutRect()).toEqual({
        x: 50,
        y: 50,
        width: 50,
        height: 50,
      });
    });
  });

  describe('redraw', () => {
    let root: RootLayout;

    beforeEach(() => {
      root = new RootLayout(
        option,
        [[new TestableDrawable(option), new TestableDataDrawable(option)]],
        {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        }
      );
    });

    it('handles empty data', () => {
      const drawable = root.findChildByClass(TestableDrawable)!;
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;
      const drawableSpy = spyOn(drawable, 'redraw');
      const dataDrawableSpy = spyOn(dataDrawable, 'redraw');

      root.redraw();

      expect(drawableSpy).toHaveBeenCalledTimes(1);
      expect(dataDrawableSpy).toHaveBeenCalledTimes(1);
    });

    it('does not re-render if paint is not dirty', () => {
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;
      const dataDrawableSpy = spyOn(dataDrawable, 'redraw');

      root.redraw();

      expect(dataDrawableSpy).toHaveBeenCalledTimes(1);

      // Nothing changed for paint to be dirty.
      root.redraw();
      expect(dataDrawableSpy).toHaveBeenCalledTimes(1);
    });

    it('re-renders if explictly marked as dirty', () => {
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;
      const dataDrawableSpy = spyOn(dataDrawable, 'redraw');

      root.redraw();
      root.markAsPaintDirty();
      root.redraw();

      expect(dataDrawableSpy).toHaveBeenCalledTimes(2);
    });

    // If the dimension of the DOM changes, even if the data has not changed, we need to
    // repaint.
    it('re-renders if layout has changed', () => {
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;
      const dataDrawableSpy = spyOn(dataDrawable, 'redraw');

      root.redraw();
      root.onResize({x: 0, y: 0, width: 200, height: 200});

      expect(dataDrawableSpy).toHaveBeenCalledTimes(1);

      root.redraw();

      expect(dataDrawableSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('data coordinate transformation', () => {
    let root: RootLayout;

    beforeEach(() => {
      const domRect = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      root = new RootLayout(
        option,
        [[new TestableDrawable(option), new TestableDataDrawable(option)]],
        domRect
      );
      const dataSeries = [
        {
          id: 'foo',
          points: [
            {x: 0, y: 0},
            {x: 1, y: 1},
            {x: 2, y: -1},
          ],
        },
        {
          id: 'bar',
          points: [
            {x: 0, y: 0},
            {x: 1, y: -10},
            {x: 2, y: 10},
          ],
        },
      ];
      root.setData(dataSeries);
      option.coordinator.setViewBoxRect({x: 0, y: -50, width: 2, height: 100});
      option.coordinator.setDomContainerRect(domRect);
    });

    it('updates the data coordinate on redraw', () => {
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;

      root.redraw();
      // Notice that data.x = 0 got map to dom.x = 50. That is because we are rendering
      // both TestableDrawable and TestableDataDrawable, both of which are flex layout,
      // and TestableDataDrawable has rect of {x: 50, y: 0, width: 50, height: 100}.
      expect(dataDrawable.getSeriesData()).toEqual([
        {id: 'foo', paths: new Float32Array([50, 50, 75, 49, 100, 51])},
        {id: 'bar', paths: new Float32Array([50, 50, 75, 60, 100, 40])},
      ]);
    });

    it('updates and redraws when the data changes', () => {
      const dataDrawable = root.findChildByClass(TestableDataDrawable)!;
      const dataDrawableSpy = spyOn(dataDrawable, 'redraw');

      root.redraw();

      root.setData([
        {
          id: 'foo',
          points: [
            {x: 0, y: 0},
            {x: 1, y: 10},
            {x: 2, y: -10},
          ],
        },
        {
          id: 'bar',
          points: [
            {x: 0, y: 0},
            {x: 1, y: 50},
            {x: 2, y: -50},
          ],
        },
      ]);
      expect(dataDrawableSpy).toHaveBeenCalledTimes(1);
      root.setData([
        {
          id: 'foo',
          points: [
            {x: 0, y: 0},
            {x: 1, y: 50},
            {x: 2, y: -50},
          ],
        },
        {
          id: 'bar',
          points: [
            {x: 0, y: 0},
            {x: 1, y: 0},
            {x: 2, y: 0},
          ],
        },
      ]);

      root.redraw();
      expect(dataDrawable.getSeriesData()).toEqual([
        {id: 'foo', paths: new Float32Array([50, 50, 75, 0, 100, 100])},
        {id: 'bar', paths: new Float32Array([50, 50, 75, 50, 100, 50])},
      ]);
      expect(dataDrawableSpy).toHaveBeenCalledTimes(2);
    });
  });
});
