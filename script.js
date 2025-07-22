/* -------- Location 表 -------- */
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
  minSpareRows: 5,
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation',

  // 当且仅当在 Location 表里粘贴
  afterPaste() {
    // 让 Team 表保持干净（只留标题 & 空行）
    teamHot.loadData([['', '']]);
  }
});

/* -------- Team 表 -------- */
const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data: [['', '']],
  colHeaders: ['BDM', 'Team Size'],
  rowHeaders: true,
  minSpareRows: 5,
  stretchH: 'all',
  copyPaste: false,        // 彻底禁止 Ctrl+V 落到 Team 表
  licenseKey: 'non-commercial-and-evaluation'
});

/* -------- 生成排班 -------- */
document.getElementById('genBtn').addEventListener('click', () => {

  const loc = locHot.getData().filter(r => r.some(c => c));
  const team = teamHot.getData().filter(r => r.some(c => c));

  if (!loc.length || !team.length) {
    alert('Location 表和 Team 表都要粘贴数据！');
    return;
  }

  const teams = team.map(r => ({
    bdm:  r[0],
    size: Number(r[1]) || 0,
    assign: [],
    cap: 0
  }));

  const weeks = ['Week1','Week2','Week3','Week4'];
  loc.forEach((row, i) => {
    const tgt = teams[i % teams.length];
    tgt.assign.push({ week: weeks[i % weeks.length], loc: row[1] });
    tgt.cap += Number(row[5]) || 0;
  });

  /* 输出表格 */
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
