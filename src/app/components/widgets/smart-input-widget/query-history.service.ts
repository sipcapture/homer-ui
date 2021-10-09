import { setStorage, getStorage } from '@app/helpers/functions';
export class QueryHistoryService {
  id_widget;

  constructor(id_widget: string) {
    this.id_widget = id_widget;
  }
  get key() {
    return 'smart-query-history-' + this.id_widget;
  }
  private setFormat(record) {
    return { timestamp: new Date().getTime(), record };
  }

  addRecord(record) {
    console.log('addRecord::', record);
    const records: any[] = getStorage(this.key) || [];

    if (
      !records.find(i => JSON.stringify(i.record) === JSON.stringify(record)) &&
      !record?.record?.match(/^\s+$/g) &&
      record?.record !== ''
    ) {
      records.unshift(this.setFormat(record));
    }

    setStorage(this.key, records.filter(({record}) => !record?.match(/^\s*$/g)).slice(0, 12));
  }
  getRecords(): any[] {
    return (getStorage(this.key) || []).map(({ record }) => record).filter(record => !record?.match(/^\s*$/g));
  }
  removeHistory() {
    localStorage.removeItem(this.key);
  }
}
