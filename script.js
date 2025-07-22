/* ---------- Location 表：6 列固定标题 ---------- */
const locHot = new Handsontable(document.getElementById('locTable'), {
  data: [Array(6).fill('')],
  colHeaders: [
    'Station',
    'Location Code',
    'Sun-Wed BD',
    'Thu-Sat BD',
    'Security Index',
    'Max BD'
  ],
  rowHeaders: true,
  stretchH: 'all',
  minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* ---------- Team 表：2 列 ---------- */
const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data: [Array(2).fill('')],
  colHeaders: ['BDM', 'Team Size'],
  rowHeaders: true,
  stretchH: 'all',
  minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* ---------- 生成排班（示例算法，后续可升级） ---------- */
document.getElementById('genBtn').addEventListener('click', () => {
  const locData = locHot.getData().filter(r => r.some(c => c));
  const teamData = teamHot.getData().filter(r => r.some(c => c));

  if (!locData.length || !teamData.length) {
    alert('两张表都要粘贴数据！');
    return;
  }

  const teams = teamData.map(r => ({
    bdm   : r[0],
    size  : Number(r[1]) || 0,
    assign: [],
    cap   : 0
  }));

  const weeks = ['Week1','Week2','Week3','Week4'];
  locData.forEach((row, i) => {
    const t = teams[i % teams.length];
    t.assign.push({ week: weeks[i % weeks.length], loc: row[1] });
    t.cap += Number(row[5]) || 0;
  });

  /* 生成结果表 */
  let html = '<h2>Schedule Result</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w => html += `<th>${w}</th>`);
  html += '<th>Team Size</th><th>Total Max BD</th><th>Crowd%</th></tr>';

  teams.forEach(t => {
    html += `<tr><td>${t.bdm}</td>`;
    weeks.forEach(w => {
      const f = t.assign.find(a => a.week === w);
      html += `<td>${f ? f.loc : ''}</td>`;
    });
    const crowd = t.size ? Math.round(t.cap / t.size * 100) : 0;
    html += `<td>${t.size}</td><td>${t.cap}</td><td>${crowd}%</td></tr>`;
  });
  html += '</table>';

  document.getElementById('output').innerHTML = html;
});
