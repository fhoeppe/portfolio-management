import { ISIN_BY_TICKER, LEGS, PLATFORM_ID, RECO, RECO_DETAIL, RECO_OP, TX, TX_OP, type RecoStateKey } from './transactions-data';

const r2 = (v: number) => Math.round(v * 100) / 100;
const q = (v: string | number | null | undefined): string => (v === undefined || v === null || v === '' ? 'null' : JSON.stringify(v));

/** Reprend `recoJson` : l'écran de rapprochement de l'Annexe STRUCT, par opération. */
export function buildRecoJson(ref: string | null): string {
  if (!ref) return '';
  const t = TX.find((x) => x.ref === ref);
  if (!t) return '';
  const st: RecoStateKey = RECO[ref] || 'pending';
  const d = RECO_DETAIL[ref] || null;
  const own = LEGS[ref] || [];
  const base = Number(ref.replace(/[^0-9]/g, '')) || 0;
  const source = own.length ? own : [{ type: TX_OP[ref] || 'OP', amount: t.amount, fees: t.fees, taxes: t.taxes }];
  const opRows = source.map((l, k) => {
    const li = own.length ? (RECO_OP[ref] || [])[k] : (RECO_OP[ref] || [])[0];
    const iG = r2(Number(l.amount) || 0);
    const iF = r2(Number(l.fees) || 0);
    const iT = r2(Number(l.taxes) || 0);
    const dOp = li ? r2(li.gross - iG + (li.fee - iF) + (li.tax - iT)) : null;
    const stOp = !li ? (st === 'pending' ? 'pending' : 'unmatched') : dOp === 0 ? 'matched' : st === 'manual' ? 'manual' : 'gap';
    return { id: base + k, sequence: k + 1, type: l.type, line: li ? li.line : null, internal: { gross: iG, fee: iF, tax: iT }, statement: li ? { gross: li.gross, fee: li.fee, tax: li.tax } : null, delta: dOp, status: stOp };
  });
  const gross = r2(opRows.reduce((a, o) => a + o.internal.gross, 0));
  const fee = r2(opRows.reduce((a, o) => a + o.internal.fee, 0));
  const tax = r2(opRows.reduce((a, o) => a + o.internal.tax, 0));
  const matchedOps = opRows.filter((o) => o.statement);
  const sGross = matchedOps.length ? r2(matchedOps.reduce((a, o) => a + (o.statement?.gross || 0), 0)) : null;
  const sFee = matchedOps.length ? r2(matchedOps.reduce((a, o) => a + (o.statement?.fee || 0), 0)) : null;
  const sTax = matchedOps.length ? r2(matchedOps.reduce((a, o) => a + (o.statement?.tax || 0), 0)) : null;
  const delta = matchedOps.length ? r2(opRows.reduce((a, o) => a + (o.delta === null ? 0 : o.delta), 0)) : null;

  return (
    '{\n' +
    `  "transactionId": ${Number(ref.replace(/[^0-9]/g, '')) || 0},\n` +
    `  "transactionRef": ${q(ref)},\n` +
    `  "status": ${q(st)},\n` +
    `  "statement": ${d ? q(d.statement) : 'null'},\n` +
    `  "statementLine": ${d ? q(d.line) : 'null'},\n` +
    `  "reconciledAt": ${d ? q(d.at) : 'null'},\n` +
    `  "reconciledBy": ${d ? q(d.by) : 'null'},\n` +
    `  "internal": { "gross": ${gross}, "fee": ${fee}, "tax": ${tax} },\n` +
    `  "statementAmounts": ${matchedOps.length ? `{ "gross": ${sGross}, "fee": ${sFee}, "tax": ${sTax} }` : 'null'},\n` +
    `  "delta": ${delta === null ? 'null' : delta},\n` +
    '  "operations": [\n' +
    opRows
      .map(
        (o) =>
          '    {\n' +
          `      "operationId": ${o.id},\n` +
          `      "sequence": ${o.sequence},\n` +
          `      "type": ${q(o.type)},\n` +
          `      "status": ${q(o.status)},\n` +
          `      "statementLine": ${o.line ? q(o.line) : 'null'},\n` +
          `      "internal": { "gross": ${o.internal.gross}, "fee": ${o.internal.fee}, "tax": ${o.internal.tax} },\n` +
          `      "statementAmounts": ${o.statement ? `{ "gross": ${o.statement.gross}, "fee": ${o.statement.fee}, "tax": ${o.statement.tax} }` : 'null'},\n` +
          `      "delta": ${o.delta === null ? 'null' : o.delta}\n` +
          '    }',
      )
      .join(',\n') +
    '\n' +
    '  ]\n' +
    '}'
  );
}

/** Reprend `structJson` : l'en-tête et les opérations numérotées de l'Annexe STRUCT. */
export function buildStructJson(ref: string | null): string {
  if (!ref) return '';
  const t = TX.find((x) => x.ref === ref);
  if (!t) return '';
  const legs = LEGS[ref] || [];
  const num = (v: number | undefined | null) => (v === undefined || v === null || (v as unknown as string) === '' ? 'null' : String(v));
  const toPf = (l: { readonly type: string; readonly account: string }, i: number): number | null => {
    if (!legs.length || (l.type !== 'TOUT' && l.type !== 'TRANSFER')) return null;
    const nx = legs[i + 1];
    return nx ? PLATFORM_ID[nx.account] || null : null;
  };
  const source = legs.length
    ? legs
    : [{ seq: 1, date: t.date, type: TX_OP[t.ref] || '', account: t.account, security: t.security, qty: t.qty, price: t.price, fee: t.fees, tax: t.taxes, settle: t.settle }];

  const ops = source
    .map((l, i) => {
      const anyL = l as { seq?: number; date?: string; type?: string; account: string; security: string; qty?: number; price?: number; fee?: number; fees?: number; tax?: number; taxes?: number };
      const lines = [
        `      "id": ${(Number(t.ref.replace(/[^0-9]/g, '')) || 0) + i},`,
        `      "sequence": ${anyL.seq || i + 1},`,
        `      "date": ${q(anyL.date || t.date)},`,
        `      "type": ${q(anyL.type || TX_OP[t.ref] || '')},`,
        `      "platform": ${num(PLATFORM_ID[anyL.account || t.account] || null)},`,
        `      "isin": ${q(ISIN_BY_TICKER[(anyL.security || t.security || '').split(' — ')[0]] || null)},`,
        `      "quantity": ${num(anyL.qty)}`,
        `      "price": ${num(anyL.price)}`,
        `      "fee": ${num(anyL.fee !== undefined ? anyL.fee : anyL.fees)}`,
        `      "tax": ${num(anyL.tax !== undefined ? anyL.tax : anyL.taxes)}`,
        `      "toPlatform": ${num(toPf({ type: anyL.type || '', account: anyL.account }, i))}`,
      ];
      const withCommas = lines.map((x, k) => (/:\s(null|[-0-9])/.test(x) && !/,$/.test(x) && k < lines.length - 1 ? x + ',' : x));
      return '    {\n' + withCommas.join('\n') + '\n    }';
    })
    .join(',\n');

  return (
    '{\n' +
    `  "id": ${Number(t.ref.replace(/[^0-9]/g, '')) || 0},\n` +
    `  "owner": ${q(t.owner || 'Fabrice HOEPPE')},\n` +
    `  "nature": ${q(t.nature)},\n` +
    `  "date": ${q(t.date)},\n` +
    `  "time": ${q(t.time || null)},\n` +
    `  "lastModified": ${q(t.modified || t.date)},\n` +
    `  "comment": ${q(t.comment || '')},\n` +
    `  "operations": [\n${ops}\n  ]\n}`
  );
}
