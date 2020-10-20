import {DataDrawable, Drawable} from './drawable';
import {LayoutOption, RectLayout} from './layout';
import {DataSeries, Rect} from '../types';

export class RootLayout extends RectLayout {
  constructor(config: LayoutOption, contentGrid: RectLayout[][], rect: Rect) {
    super(config, contentGrid);
    this.onResize(rect);
  }

  onResize(rect: Rect) {
    this.internalOnlySetLayout(rect);
    this.relayout();
    for (const content of this.getAllDescendents()) {
      content.relayout();
    }
  }

  async redraw() {
    for (const content of this.getAllDescendents()) {
      if (content instanceof DataDrawable) {
        content.internalOnlyTransformCoordinatesIfStale();
      }
    }

    for (const content of this.getAllDescendents()) {
      if (content instanceof Drawable) {
        content.internalOnlyRedraw();
      }
    }
  }

  markAsPaintDirty() {
    for (const content of this.getAllDescendents()) {
      if (content instanceof Drawable) {
        content.markAsPaintDirty();
      }
    }
  }

  setData(data: DataSeries[]) {
    for (const content of this.getAllDescendents()) {
      if (content instanceof DataDrawable) {
        return content.setData(data);
      }
    }
  }

  private *getAllDescendents(): Generator<RectLayout> {
    const contents = [...this.children()];

    while (contents.length) {
      const content = contents.shift()!;
      contents.push(...content.children());
      yield content;
    }
  }

  findChildByClass<T extends RectLayout>(
    klass: new (...params: any[]) => T
  ): T | null {
    for (const child of this.getAllDescendents()) {
      if (child instanceof klass) {
        return child;
      }
    }

    return null;
  }
}
