import { MetricsPanelCtrl } from 'app/plugins/sdk';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';

import echarts from './libs/echarts.min';
import './libs/dark';
import './style.css!';
import './libs/china.js';
import './libs/bmap.js';
import './libs/getBmap.js';

import DataFormatter from './data_formatter';



export class Controller extends MetricsPanelCtrl {

    constructor($scope, $injector) {
        super($scope, $injector);

        const panelDefaults = {
            EchartsOption: 'option = {};',
            IS_UCD: false,
            METHODS: ['POST', 'GET'],
            ETYPE: ['line', 'pie', 'map'],
            url: '',
            method: 'POST',
            upInterval: 60000,
            esMetric: 'Count'
        };

        _.defaults(this.panel, panelDefaults);

        this.dataFormatter = new DataFormatter(this, kbn);

        this.events.on('data-received', this.onDataReceived.bind(this));
        this.events.on('data-error', this.onDataError.bind(this));
        this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-initialized', this.render.bind(this));

        this.refreshData();
    }


    onDataReceived(dataList) {
        this.data = this.panel.IS_UCD ? this.customizeData : dataList;

        if (this.panel.type == 'map') {
            const data  = [];
            this.dataFormatter.setGeohashValues(dataList, data);
            this.data = this.dataFormatter.aggByProvince(data);
        }

        this.refreshed = true;
        this.render();
        this.refreshed = false;
    }


    onDataError(err) {
        this.render();
    }


    onInitEditMode() {
        this.addEditorTab('Customize Data', 'public/plugins/grafana-echarts-panel/partials/editor-ds.html', 2);
        this.addEditorTab('Echarts Option', 'public/plugins/grafana-echarts-panel/partials/editor-echarts.html', 3);
    }


    refreshData() {
        let _this = this, xmlhttp;

        if (window.XMLHttpRequest) {
            xmlhttp = new XMLHttpRequest();
        } else {
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }

        let data = [];
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                _this.customizeData = JSON.parse(xmlhttp.responseText);
                _this.onDataReceived();
            }
        };

        if (this.panel.IS_UCD) {
            xmlhttp.open(_this.panel.method, _this.panel.url, true);
            xmlhttp.send();
        } else {
            xmlhttp = null;
        }

        this.$timeout(() => { this.refreshData(); }, _this.panel.upInterval);
    }


    getPanelPath() {
        // the system loader preprends publib to the url, add a .. to go back one level
        return '../' + grafanaBootData.settings.panels[this.pluginId].baseUrl + '/';
    }


    link(scope, elem, attrs, ctrl) {
        const $panelContainer = elem.find('.echarts_container')[0];
        let option = {}, echartsData = [];

        ctrl.refreshed = true;

        function setHeight() {
            let height = ctrl.height || panel.height || ctrl.row.height;
            if (_.isString(height)) {
                height = parseInt(height.replace('px', ''), 10);
            }

            $panelContainer.style.height = height + 'px';
        }

        setHeight();

        let myChart = echarts.init($panelContainer, 'dark');

        setTimeout(function () {
            myChart.resize();
        }, 1000);

        var callInterval = function callInterval() {
            var timeout, result;

            function func(callBack, interval) {
                var context = this; // jshint ignore:line
                var args = arguments;

                if (timeout) clearInterval(timeout);

                timeout = setInterval(function () {
                    result = callBack.apply(context, args);
                }, interval);

                return result;
            }

            return func;
        }();

        function render() {

            if (!myChart) {
                return;
            }

            setHeight();
            myChart.resize();

            if (ctrl.refreshed) {
                myChart.clear();
                echartsData = ctrl.data;

                eval(ctrl.panel.EchartsOption); // jshint ignore:line

                myChart.setOption(option);
            }
        }

        this.events.on('render', function () {
            render();
            ctrl.renderingCompleted();
        });
    }
}

Controller.templateUrl = 'partials/module.html';
