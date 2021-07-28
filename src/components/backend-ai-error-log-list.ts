/**
 @license
 Copyright (c) 2015-2021 Lablup Inc. All rights reserved.
 */

import {translate as _t} from 'lit-translate';
import {css, CSSResultArray, CSSResultOrNative, customElement, html, property} from 'lit-element';

import '@vaadin/vaadin-grid/vaadin-grid';
import '@vaadin/vaadin-grid/vaadin-grid-selection-column';
import '@vaadin/vaadin-grid/vaadin-grid-sorter';
import '@vaadin/vaadin-grid/vaadin-grid-sort-column';
import '@vaadin/vaadin-icons/vaadin-icons';

import 'weightless/card';
import 'weightless/dialog';
import 'weightless/checkbox';
import 'weightless/title';
import 'weightless/expansion';
import 'weightless/icon';
import 'weightless/button';
import 'weightless/label';

import './lablup-loading-spinner';
import './backend-ai-indicator';
import '../plastics/lablup-shields/lablup-shields';
import '@material/mwc-icon';
import '@material/mwc-icon-button';

import {BackendAiStyles} from './backend-ai-general-styles';
import {BackendAIPage} from './backend-ai-page';
import {IronFlex, IronFlexAlignment} from '../plastics/layout/iron-flex-layout-classes';

/**
 Backend.AI Error Log List

@group Backend.AI Web UI
 @element backend-ai-error-log-list
 */

@customElement('backend-ai-error-log-list')
export default class BackendAiErrorLogList extends BackendAIPage {
  @property({type: String}) timestamp = '';
  @property({type: String}) errorType = '';
  @property({type: String}) requestUrl = '';
  @property({type: String}) statusCode = '';
  @property({type: String}) statusText = '';
  @property({type: String}) title = '';
  @property({type: String}) message = '';
  @property({type: Array}) logs = [];
  @property({type: Array}) _selected_items = [];
  @property({type: Object}) spinner = Object();
  @property({type: Object}) _grid = Object();
  @property({type: Object}) logView = Object();
  @property({type: Number}) _pageSize = 25;
  @property({type: Number}) _currentPage = 1;
  @property({type: Number}) _totalLogCount = 0;

  constructor() {
    super();
  }

  static get styles(): CSSResultOrNative | CSSResultArray {
    return [
      BackendAiStyles,
      IronFlex,
      IronFlexAlignment,
      // language=CSS
      css`
        div.log-list {
          height: calc(100vh - 305px);
        }

        div.blank-box-large {
          padding: 11.3rem 0;
        }

        span#no-data-message {
          font-size: 20px;
          font-weight: 200;
          display: block;
          color: #999999;
        }

        vaadin-grid {
          width: 100%;
          border: 0;
          font-size: 12px;
        }

        vaadin-grid-cell {
          font-size: 10px;
        }

        vaadin-grid#list-grid {
          border-top: 1px solid #dbdbdb;
        }

        [error-cell] {
          color: red;
        }

        wl-label {
          --label-font-family: 'Ubuntu', Roboto;
          --label-color: black;
        }

        wl-icon.pagination {
          color: var(--paper-grey-700);
        }

        wl-button.pagination[disabled] wl-icon.pagination {
          color: var(--paper-grey-300);
        }

        wl-button.pagination {
          width: 15px;
          height: 15px;
          padding: 10px;
          box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.2);
          --button-bg: transparent;
          --button-bg-hover: var(--paper-teal-100);
          --button-bg-active: var(--paper-teal-600);
          --button-bg-active-flat: var(--paper-teal-600);
          --button-bg-disabled: var(--paper-grey-50);
          --button-color-disabled: var(--paper-grey-200);
        }
      `];
  }

  firstUpdated() {
    this.spinner = this.shadowRoot.querySelector('#loading-spinner');
    this._updatePageItemSize();
    this._grid = this.shadowRoot.querySelector('#list-grid');
    if (!globalThis.backendaiclient || !globalThis.backendaiclient.is_admin) {
      this.shadowRoot.querySelector('vaadin-grid').style.height = 'calc(100vh - 275px)!important';
    }
    this.notification = globalThis.lablupNotification;
    document.addEventListener('log-message-refresh', () => this._refreshLogData());
    document.addEventListener('log-message-clear', () => this._clearLogData());
  }

  /**
   * Update the page size according to tab size.
   */
  _updatePageItemSize() {
    const tableSize = window.innerHeight - 275 - 30;
    this._pageSize = Math.floor(tableSize / 31);
  }

  /**
   * Refresh log data.
   */
  _refreshLogData() {
    this.spinner.show();
    this._updatePageItemSize();
    this.logs = JSON.parse(localStorage.getItem('backendaiwebui.logs') || '{}');
    this._totalLogCount = this.logs.length > 0 ? this.logs.length : 1;
    this._updateItemsFromPage(1);
    this._grid.clearCache();
    this.spinner.hide();
  }

  /**
   * Clear log data.
   */
  _clearLogData() {
    this.logs = [];
    this.logView = [];
    this._totalLogCount = 1;
    this._currentPage = 1;
    this._grid.clearCache();
  }

  /**
   * Update items from page target.
   *
   * @param {number | HTMLElement} page - page number or page number HTMLelement
   */
  _updateItemsFromPage(page) {
    if (typeof page !== 'number') {
      let page_action = page.target;
      if (page_action['role'] !== 'button') {
        page_action = page.target.closest('mwc-icon-button');
      }
      page_action.id === 'previous-page' ? this._currentPage -= 1 : this._currentPage += 1;
    }
    const start = (this._currentPage - 1) * this._grid.pageSize;
    const end = this._currentPage * this._grid.pageSize;
    if (this.logs.length > 0) {
      const logData = this.logs.slice(start, end);
      logData.forEach((item: any) => {
        item.timestamp_hr = this._humanReadableTime(item.timestamp);
      });

      this.logView = logData; // this.logs.slice(start, end);
    }
  }

  /**
   * Change d of any type to human readable date time.
   *
   * @param {string | Date} d - Data string or object
   * @return {string} Human readable time string
   */
  _humanReadableTime(d: any) {
    d = new Date(d);
    const option = {hour12: false};
    return d.toLocaleString('en-US', option);
  }

  /**
   * Change d of any type to ISO date time.
   *
   * @param {string | Date} d - Data string or object
   * @return {string} ISO time string
   */
  _toISOTime(d: any) {
    d = new Date(d);
    return d.toISOString();
  }

  render() {
    // language=HTML
    return html`
      <div class="log-list">
        <vaadin-grid id="list-grid" height-by-rows page-size="${this._pageSize}"
                     theme="row-stripes column-borders compact wrap-cell-content"
                     aria-label="Error logs" .items="${this.logView}">
          <vaadin-grid-column width="250px" flex-grow="0" text-align="start" auto-width header="${_t('logs.TimeStamp')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span class="monospace">[[item.timestamp_hr]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable flex-grow="0" text-align="start" auto-width header="${_t('logs.Status')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span>[[item.statusCode]] [[item.statusText]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable flex-grow="0" text-align="start" auto-width header="${_t('logs.ErrorTitle')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span>[[item.title]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable flex-grow="0" text-align="start" auto-width header="${_t('logs.ErrorMessage')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span>[[item.message]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column width="50px" flex-grow="0" text-align="start" auto-width header="${_t('logs.ErrorType')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span>[[item.type]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable flex-grow="0" text-align="start" auto-width header="${_t('logs.Method')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span>[[item.requestMethod]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable flex-grow="0" text-align="start" auto-width header="${_t('logs.RequestUrl')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span class="monospace">[[item.requestUrl]]</span>
                </div>
            </template>
          </vaadin-grid-column>
          <vaadin-grid-column resizable auto-width flex-grow="0" text-align="start" header="${_t('logs.Parameters')}">
            <template>
                <div class="layout vertical" error-cell$="[[item.isError]]">
                  <span class="monospace">[[item.requestParameters]]</span>
                </div>
            </template>
          </vaadin-grid-column>
        </vaadin-grid>
        ${this._totalLogCount == 0 ? html`
          <div class="vertical layout center flex blank-box-large">
            <lablup-loading-spinner id="loading-spinner"></lablup-loading-spinner>
          </div>`
        : html`
          ${this._totalLogCount == 1 && this.logs.length == 0 ? html`
            <div class="vertical layout center flex blank-box-large">
              <span id="no-data-message">${_t('credential.NoCredentialToDisplay')}</span>
            </div>
          ` : html``}
        `}
      </div>
      <div class="horizontal center-justified layout flex" style="padding: 10px;border-top:1px solid #ccc;">
        <mwc-icon-button
            class="pagination"
            id="previous-page"
            icon="navigate_before"
            ?disabled="${this._currentPage === 1}"
            @click="${(e) => {
    this._updateItemsFromPage(e);
  }}"></mwc-icon-button>
        <wl-label style="padding: 5px 15px 0px 15px;">
          ${this._currentPage} / ${Math.ceil( this._totalLogCount / this._pageSize)}
        </wl-label>
        <mwc-icon-button
            class="pagination"
            id="next-page"
            icon="navigate_next"
            ?disabled="${this._totalLogCount <= this._pageSize * this._currentPage}"
            @click="${(e) => {
    this._updateItemsFromPage(e);
  }}"></mwc-icon-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'backend-ai-error-log-list': BackendAiErrorLogList;
  }
}
