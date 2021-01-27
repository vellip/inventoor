/* globals gapi  */

const sheetColumns = ['EAN', 'Bezeichnung', 'Anzal SOLL', 'Anzahl IST', 'Einkaufspreis', 'Seriennummer']
export const columns = ['EAN', 'Bezeichnung', 'Anzahl SOLL', 'Anzahl IST']
const SHEET_ID = 100

export async function createSpreadsheets() {
  return gapi.client.sheets.spreadsheets.create(
    {},
    {
      properties: {
        title: `Inventur, Stand: ${new Date().toLocaleString('de-DE')}`,
        locale: 'de',
      },
      sheets: [
        {
          properties: {
            title: 'Tabellenblatt 1',
            sheetId: SHEET_ID,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              rowData: [
                {
                  values: sheetColumns.map((column) => ({
                    userEnteredValue: { stringValue: column },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }
  )
}
export async function updateSpreadsheets(spreadsheetId, codes) {
  return gapi.client.sheets.spreadsheets.batchUpdate(
    { spreadsheetId },
    {
      requests: [
        {
          appendCells: {
            sheetId: SHEET_ID,
            fields: '*',
            rows: Object.keys(codes).map((code) => {
              const codeObj = codes[code]

              return {
                values: [
                  { userEnteredValue: { stringValue: code } },
                  { userEnteredValue: { stringValue: codeObj.name || '' } },
                  { userEnteredValue: { numberValue: codeObj.valueShould } },
                  { userEnteredValue: { numberValue: codeObj.valueIs } },
                ],
              }
            }),
          },
        },
      ],
    }
  )
}
