import _ from 'lodash';
import decodeGeoHash from './geohash';

import py2hz from './china_city_mapping';

export default class DataFormatter {
  constructor(ctrl, kbn) {
    this.ctrl = ctrl;
    this.kbn = kbn;
  }

  setValues(data) {
    if (this.ctrl.series && this.ctrl.series.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      this.ctrl.series.forEach((serie) => {
        const lastPoint = _.last(serie.datapoints);
        const lastValue = _.isArray(lastPoint) ? lastPoint[0] : null;
        const location = _.find(this.ctrl.locations, (loc) => { return loc.key.toUpperCase() === serie.alias.toUpperCase(); });

        if (!location) return;

        if (_.isString(lastValue)) {
          data.push({key: serie.alias, value: 0, valueFormatted: lastValue, valueRounded: 0});
        } else {
          const dataValue = {
            key: serie.alias,
            locationName: location.name,
            locationLatitude: location.latitude,
            locationLongitude: location.longitude,
            value: serie.stats[this.ctrl.panel.valueName],
            valueFormatted: lastValue,
            valueRounded: 0
          };

          if (dataValue.value > highestValue) highestValue = dataValue.value;
          if (dataValue.value < lowestValue) lowestValue = dataValue.value;

          dataValue.valueRounded = this.kbn.roundValue(dataValue.value, parseInt(this.ctrl.panel.decimals, 10) || 0);
          data.push(dataValue);
        }
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }

  setGeohashValues(dataList, data) {
    if (!this.ctrl.panel.esGeoPoint || !this.ctrl.panel.esMetric) return;

    if (dataList && dataList.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;
      console.info('setGeohashValues...');
      dataList[0].datapoints.forEach((datapoint) => {
        const encodedGeohash = datapoint[this.ctrl.panel.esGeoPoint];
        const decodedGeohash = decodeGeoHash(encodedGeohash);
        
        // const dataValue = {
        //   key: encodedGeohash,
        //   locationName: this.ctrl.panel.esLocationName ? datapoint[this.ctrl.panel.esLocationName] : encodedGeohash,
        //   locationLatitude: decodedGeohash.latitude,
        //   locationLongitude: decodedGeohash.longitude,
        //   value: datapoint[this.ctrl.panel.esMetric],
        //   valueFormatted: datapoint[this.ctrl.panel.esMetric],
        //   valueRounded: 0
        // };

        const dataValue = {
          name: this.ctrl.panel.esLocationName ? py2hz(datapoint[this.ctrl.panel.esLocationName]) : encodedGeohash,
          value: datapoint[this.ctrl.panel.esMetric] 
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }

  static tableHandler(tableData) {
    const datapoints = [];

    if (tableData.type === 'table') {
      const columnNames = {};

      tableData.columns.forEach((column, columnIndex) => {
        columnNames[columnIndex] = column.text;
      });

      tableData.rows.forEach((row) => {
        const datapoint = {};

        row.forEach((value, columnIndex) => {
          const key = columnNames[columnIndex];
          datapoint[key] = value;
        });

        datapoints.push(datapoint);
      });
    }

    return datapoints;
  }

  setTableValues(tableData, data) {
    if (tableData && tableData.length > 0) {
      let highestValue = 0;
      let lowestValue = Number.MAX_VALUE;

      tableData[0].forEach((datapoint) => {
        if (!datapoint.geohash) {
          return;
        }

        const encodedGeohash = datapoint.geohash;
        const decodedGeohash = decodeGeoHash(encodedGeohash);

        const dataValue = {
          key: encodedGeohash,
          locationName: datapoint[this.ctrl.panel.tableLabel] || 'n/a',
          locationLatitude: decodedGeohash.latitude,
          locationLongitude: decodedGeohash.longitude,
          value: datapoint.metric,
          valueFormatted: datapoint.metric,
          valueRounded: 0
        };

        if (dataValue.value > highestValue) highestValue = dataValue.value;
        if (dataValue.value < lowestValue) lowestValue = dataValue.value;

        dataValue.valueRounded = this.kbn.roundValue(dataValue.value, this.ctrl.panel.decimals || 0);
        data.push(dataValue);
      });

      data.highestValue = highestValue;
      data.lowestValue = lowestValue;
      data.valueRange = highestValue - lowestValue;
    }
  }

  aggByProvince(data) {
    if (!data || data.length == 0) return [];

    let sum = (total, item) => total += item.value;
    let ret = _.chain(data)
      .groupBy('name') 
      .map((group, name) => ({ name: name, value : _.reduce(group, sum, 0) }))
      .value();

    return ret; 
  }

}
