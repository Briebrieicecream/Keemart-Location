/* ---------- 初始化两张 Handsontable ---------- */
const locHot = new Handsontable(document.getElementById('locTable'), {
  data: [Array(6).fill('')],                    // 先给一行空白
  colHeaders: [
    'Station',
    'Location Code',
    'Sun-Wed BD',
    'Thu-Sat BD',
    'Security Index',
    'Max BD'
  ],
  rowHeaders: true,                             // 左侧自动序号（不可编辑）
  minRows: 10,                                  // 预留 10 行空白
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation'
});

const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data: [Array(2).fill('')],
  colHeaders: ['BDM', 'Team Size'],
  rowHeaders: true,
  minRows: 10,
  stretchH: 'all',
  licenseKey: 'non-commercial-and-evaluation'
});

/* ---------- 生成排班（示范逻辑，可再优化） ---------- */
document.getElementById('genBtn').addEventListener('click', () => {
  // 1) 读取两张表数据并去掉空行
  const locData = locHot.getData().slice(0).filter(r => r.some(c => c));
  const teamData = teamHot.getData().slice(0).filter(r => r.some(c => c));

  if (!locData.length || !teamData.length) {
    alert('请先粘贴 Location 表和 Team 表数据！');
    return;
  }

  // 2) 构建团队对象
  const teams = teamData.map(r => ({
    bdm:  r[0],
    size: Number(r[1] || 0),
    assigned: [],
    total: 0
  }));

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  let idx = 0;

  // 3) 轮流把点位分给 BDM（演示版：按顺序均分）
  locData.forEach((row, i) => {
    const tgt = teams[idx % teams.length];
    const locName = row[1];
    const maxBD   = Number(row[5] || 0);
    tgt.assigned.push({ week: weeks[i % weeks.length], loc: locName });
    tgt.total += maxBD;
    idx++;
  });

  // 4) 生成结果表 HTML
  let html = '<h2>Schedule Result</h2><table class=\"result\"><tr><th>BDM</th>';
  weeks.forEach(w => (html += `<th>${w}</th>`));
  html += '<th>Team Size</th><th>Total Max BD</th><th>Crowd %</th></tr>';

  teams.forEach(t => {
    html += `<tr><td>${t.bdm}</td>`;
    weeks.forEach(w => {
      const row = t.assigned.find(a => a.week === w);
      html += `<td>${row ? row.loc : ''}</td>`;
    });
    const crowd = t.size ? Math.round((t.total / t.size) * 100) : 0;
    html += `<td>${t.size}</td><td>${t.total}</td><td>${crowd}%</td></tr>`;
  });
  html += '</table>';

  document.getElementById('output').innerHTML = html;
});
