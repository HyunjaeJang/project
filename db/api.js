export const fetchDrugInfo = useCallback(async (itemSeq) => {
  setLoading(true);
  setError(null);
  setData(null);

  const url =
    'https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService06/getDrugPrdtPrmsnDtlInq05';
  const params = {
    serviceKey:
      'NAGUqW3ZS8n2SYKGKh9RbO3yUEsszniAu2WYCH7ppgMwb3oo1AW+OcaAT8o6Rst422XyIblNg4YvWn8wVDTDAA==',
    pageNo: '1',
    numOfRows: '1',
    item_seq: itemSeq,
    type: 'json',
  };
  const queryString = Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');

  try {
    const response = await fetch(`${url}?${queryString}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    if (!json.body.items) {
      throw new Error('No data found.');
    }

    const itemData = json.body.items[0];
    const packUnits = itemData.PACK_UNIT?.split(',') || [];
    const parsed = parsePackUnit(packUnits);
    setParsedPackUnits(parsed);

    const finalData = {
      ...itemData,
      parsedPackUnit: parsed,
    };
    setData(finalData);

    await checkAndSaveMedicine(finalData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []);
