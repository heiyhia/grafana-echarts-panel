'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/utils/kbn', './libs/echarts.min', './libs/dark', './style.css!', './libs/china.js', './data_formatter'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, _, kbn, echarts, DataFormatter, _createClass, Controller;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }, function (_libsEchartsMin) {
            echarts = _libsEchartsMin.default;
        }, function (_libsDark) {}, function (_styleCss) {}, function (_libsChinaJs) {}, function (_data_formatter) {
            DataFormatter = _data_formatter.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export('Controller', Controller = function (_MetricsPanelCtrl) {
                _inherits(Controller, _MetricsPanelCtrl);

                function Controller($scope, $injector) {
                    _classCallCheck(this, Controller);

                    var _this2 = _possibleConstructorReturn(this, (Controller.__proto__ || Object.getPrototypeOf(Controller)).call(this, $scope, $injector));

                    var panelDefaults = {
                        EchartsOption: 'option = {};',
                        IS_UCD: false,
                        METHODS: ['POST', 'GET'],
                        ETYPE: ['line', 'pie', 'map'],
                        url: '',
                        method: 'POST',
                        upInterval: 60000,
                        esMetric: 'Count'
                    };

                    _.defaults(_this2.panel, panelDefaults);

                    _this2.dataFormatter = new DataFormatter(_this2, kbn);

                    _this2.events.on('data-received', _this2.onDataReceived.bind(_this2));
                    _this2.events.on('data-error', _this2.onDataError.bind(_this2));
                    _this2.events.on('data-snapshot-load', _this2.onDataReceived.bind(_this2));
                    _this2.events.on('init-edit-mode', _this2.onInitEditMode.bind(_this2));
                    _this2.events.on('panel-initialized', _this2.render.bind(_this2));

                    _this2.refreshData();
                    return _this2;
                }

                _createClass(Controller, [{
                    key: 'onDataReceived',
                    value: function onDataReceived(dataList) {
                        this.data = this.panel.IS_UCD ? this.customizeData : dataList;

                        if (this.panel.type == 'map') {
                            var data = [];
                            this.dataFormatter.setGeohashValues(dataList, data);
                            this.data = this.dataFormatter.aggByProvince(data);
                        }

                        this.refreshed = true;
                        this.render();
                        this.refreshed = false;
                    }
                }, {
                    key: 'onDataError',
                    value: function onDataError(err) {
                        this.render();
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Customize Data', 'public/plugins/grafana-echarts-panel/partials/editor-ds.html', 2);
                        this.addEditorTab('Echarts Option', 'public/plugins/grafana-echarts-panel/partials/editor-echarts.html', 3);
                    }
                }, {
                    key: 'refreshData',
                    value: function refreshData() {
                        var _this3 = this;

                        var _this = this,
                            xmlhttp = void 0;

                        if (window.XMLHttpRequest) {
                            xmlhttp = new XMLHttpRequest();
                        } else {
                            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                        }

                        var data = [];
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

                        this.$timeout(function () {
                            _this3.refreshData();
                        }, _this.panel.upInterval);
                    }
                }, {
                    key: 'getPanelPath',
                    value: function getPanelPath() {
                        // the system loader preprends publib to the url, add a .. to go back one level
                        return '../' + grafanaBootData.settings.panels[this.pluginId].baseUrl + '/';
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem, attrs, ctrl) {
                        var $panelContainer = elem.find('.echarts_container')[0];
                        var option = {},
                            echartsData = [];

                        ctrl.refreshed = true;

                        function setHeight() {
                            var height = ctrl.height || panel.height || ctrl.row.height;
                            if (_.isString(height)) {
                                height = parseInt(height.replace('px', ''), 10);
                            }

                            $panelContainer.style.height = height + 'px';
                        }

                        setHeight();

                        var myChart = echarts.init($panelContainer, 'dark');

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
                }]);

                return Controller;
            }(MetricsPanelCtrl));

            _export('Controller', Controller);

            Controller.templateUrl = 'partials/module.html';
        }
    };
});
//# sourceMappingURL=controller.js.map
