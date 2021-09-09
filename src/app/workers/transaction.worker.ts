/// <reference lib="webworker" />

import { TransactionProcessor } from '@app/helpers/parser';

const tp = new TransactionProcessor();

addEventListener('message', ({ data }) => {
  const { metaData, srcdata } = JSON.parse(data);
  if (metaData && metaData.workerCommand) {
    const outputData = tp.transactionData(srcdata, metaData.workerCommand);
    const response = JSON.stringify(outputData);
    postMessage(response);
  } else {
    postMessage(JSON.stringify({ error: 'metaData.workerCommand is undefined' }));
  }
});
