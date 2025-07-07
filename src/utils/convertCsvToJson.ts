import * as csv from 'csvtojson';

export const converCsvToJson = async(path: string): Promise<unknown[]> => {
    return await csv({
      delimiter: [';', ' ', ','],
      checkColumn: true,
      ignoreEmpty: true
    }).fromFile(path);
  }