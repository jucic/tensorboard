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
import {
  Component,
  EventEmitter,
  Input,
  NO_ERRORS_SCHEMA,
  Output,
} from '@angular/core';
import {fakeAsync, flush, TestBed, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Action, Store} from '@ngrx/store';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {State} from '../../../app_state';

import * as selectors from '../../../selectors';
import {RunColorScale} from '../../../types/ui';
import * as actions from '../../actions';
import {MetricsDataSourceModule, PluginType} from '../../data_source';
import {appStateFromMetricsState, buildMetricsState} from '../../testing';

import {CardViewComponent} from './card_view_component';
import {CardViewContainer, TEST_ONLY} from './card_view_container';

@Component({
  selector: 'scalar-card',
  template: ``,
})
class TestableScalarCard {
  @Input() runColorScale!: RunColorScale;
  @Output() fullWidthChanged = new EventEmitter<boolean>();
  @Output() fullHeightChanged = new EventEmitter<boolean>();
  @Output() pinStateChanged = new EventEmitter<void>();
}

describe('card view test', () => {
  let store: MockStore<State>;
  let dispatchedActions: Action[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MetricsDataSourceModule],
      declarations: [CardViewComponent, CardViewContainer, TestableScalarCard],
      providers: [
        provideMockStore({
          initialState: appStateFromMetricsState(buildMetricsState()),
        }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    dispatchedActions = [];
    store = TestBed.inject<Store<State>>(Store) as MockStore<State>;
    spyOn(store, 'dispatch').and.callFake((action: Action) => {
      dispatchedActions.push(action);
    });
    store.overrideSelector(selectors.getRunColorMap, {});
  });

  [
    {tagName: 'scalar-card', pluginType: PluginType.SCALARS},
    {tagName: 'image-card', pluginType: PluginType.IMAGES},
    {tagName: 'histogram-card', pluginType: PluginType.HISTOGRAMS},
  ].forEach(({tagName, pluginType}) => {
    it(`renders proper component for pluginType: ${pluginType}`, () => {
      const fixture = TestBed.createComponent(CardViewContainer);
      fixture.componentInstance.cardId = 'cardId';
      fixture.componentInstance.pluginType = pluginType;
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css(tagName))).not.toBeNull();
    });
  });

  it('updates full width upon card notification', () => {
    const fixture = TestBed.createComponent(CardViewContainer);
    fixture.componentInstance.cardId = 'cardId';
    fixture.componentInstance.pluginType = PluginType.SCALARS;
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-width']).not.toBeTruthy();

    const scalarCard = fixture.debugElement.query(By.css('scalar-card'));
    scalarCard.componentInstance.fullWidthChanged.emit(true);
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-width']).toBe(true);

    scalarCard.componentInstance.fullWidthChanged.emit(false);
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-width']).not.toBeTruthy();
  });

  it('updates full height upon card notification', () => {
    const fixture = TestBed.createComponent(CardViewContainer);
    fixture.componentInstance.cardId = 'cardId';
    fixture.componentInstance.pluginType = PluginType.SCALARS;
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-height']).not.toBeTruthy();

    const scalarCard = fixture.debugElement.query(By.css('scalar-card'));
    scalarCard.componentInstance.fullHeightChanged.emit(true);
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-height']).toBe(true);

    scalarCard.componentInstance.fullHeightChanged.emit(false);
    fixture.detectChanges();

    expect(fixture.debugElement.classes['full-height']).not.toBeTruthy();
  });

  it('dispatches action when pin state changes', () => {
    const fixture = TestBed.createComponent(CardViewContainer);
    fixture.componentInstance.cardId = 'cardId';
    fixture.componentInstance.pluginType = PluginType.SCALARS;
    fixture.detectChanges();

    const scalarCard = fixture.debugElement.query(By.css('scalar-card'));
    scalarCard.componentInstance.pinStateChanged.emit(true);
    fixture.detectChanges();

    expect(dispatchedActions).toEqual([
      actions.cardPinStateToggled({
        cardId: 'cardId',
        canCreateNewPins: true,
        wasPinned: false,
      }),
    ]);

    store.overrideSelector(selectors.getCardPinnedState, true);
    store.refreshState();
    scalarCard.componentInstance.pinStateChanged.emit(false);
    fixture.detectChanges();

    expect(dispatchedActions).toEqual([
      actions.cardPinStateToggled({
        cardId: 'cardId',
        canCreateNewPins: true,
        wasPinned: false,
      }),
      actions.cardPinStateToggled({
        cardId: 'cardId',
        canCreateNewPins: true,
        wasPinned: true,
      }),
    ]);
  });

  it(`throttles updates to colorScale`, fakeAsync(() => {
    store.overrideSelector(selectors.getRunColorMap, {run1: '#000'});
    const fixture = TestBed.createComponent(CardViewContainer);
    fixture.componentInstance.cardId = 'cardId';
    fixture.componentInstance.pluginType = PluginType.SCALARS;
    fixture.detectChanges();

    const scalarCard = fixture.debugElement.query(By.css('scalar-card'));
    expect(scalarCard.componentInstance.runColorScale('run1')).toBe('#000');

    store.overrideSelector(selectors.getRunColorMap, {run1: '#555'});
    store.refreshState();
    fixture.detectChanges();

    expect(scalarCard.componentInstance.runColorScale('run1')).toBe('#000');

    store.overrideSelector(selectors.getRunColorMap, {run1: '#aaa'});
    store.refreshState();
    fixture.detectChanges();

    tick(TEST_ONLY.RUN_COLOR_UPDATE_THROTTLE_TIME_IN_MS);
    fixture.detectChanges();

    expect(scalarCard.componentInstance.runColorScale('run1')).toBe('#aaa');
    flush();
  }));

  it('getting unknown color throws error', () => {
    store.overrideSelector(selectors.getRunColorMap, {run1: '#000'});
    const fixture = TestBed.createComponent(CardViewContainer);
    fixture.componentInstance.cardId = 'cardId';
    fixture.componentInstance.pluginType = PluginType.SCALARS;
    fixture.detectChanges();

    const scalarCard = fixture.debugElement.query(By.css('scalar-card'));
    expect(() => {
      scalarCard.componentInstance.runColorScale('meow');
    }).toThrowError(Error, '[Color scale] unknown runId: meow.');
  });
});
