/* ---------- 初始化 Location 表 ---------- */
const locHot = new Handsontable(document.getElementById('locTable'), {
  data: [Array(6).fill('')],
  colHeaders: ['Station','Location Code','Sun-Wed BD','Thu-Sat BD','Security Index','Max BD'],
  rowHeaders: true,
  stretchH: 'all',
  minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* ---------- 初始化 Team 表 ---------- */
const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data: [Array(2).fill('')],
  colHeaders: ['BDM','Team Size'],
  rowHeaders: true,
  stretchH: 'all',
  minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* ---------- 生成排班 ---------- */
document.getElementById('genBtn').addEventListener('click', () => {

  /* 1. 取数据，去空行 */
  const locRows = locHot.getData().filter(r => r.some(c => c));
  const teamRows = teamHot.getData().filter(r => r.some(c => c));

  if (!locRows.length || !teamRows.length) {
    alert('两张表都要粘贴数据！'); return;
  }

  /* 2. 构建团队对象 */
  const teams = teamRows.map(r => ({
    bdm: r[0],
    size: Number(r[1]) || 0,
    capSum: 0,
    assign: []            // {week, loc, cap}
  }));

  /* 3. 点位按 Max BD 降序 */
  locRows.sort((a,b) => Number(b[5]) - Number(a[5]));

  /* 4. 贪心分配 —— 每次给 crowd% 最高的团队 */
  const weeks = ['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];

  const crowd = t => t.size ? t.capSum / t.size : Infinity;
  for (let i = 0; i < locRows.length; i++) {
    // 找当前最拥挤团队
    teams.sort((a,b) => crowd(b) - crowd(a));
    const t = teams[0];

    const row = locRows[i];
    const cap = Number(row[5]) || 0;
    t.assign.push({ week: weeks[i % weeks.length], loc: row[1], cap });
    t.capSum += cap;
  }

  /* 5. ---------- 视图1 · 点位维度 ---------- */
  let v1 = '<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w => v1 += `<th>${w}</th>`); v1 += '</tr>';

  locRows.forEach(row => {
    v1 += `<tr><td>${row[1]}</td>`;
    weeks.forEach(w=>{
      const t = teams.find(tm => tm.assign.find(a => a.week===w && a.loc===row[1]));
      v1 += `<td>${t ? t.bdm : ''}</td>`;
    });
    v1 += '</tr>';
  });
  v1 += '</table>';

  /* 6. ---------- 视图2 · 团队维度 ---------- */
  let v2 = '<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w => v2 += `<th>${w}</th>`); v2 += '</tr>';

  teams.forEach(t => {
    v2 += `<tr><td>${t.bdm}</td>`;
    weeks.forEach(w => {
      const hit = t.assign.find(a => a.week===w);
      v2 += `<td>${hit ? hit.loc : '/'}</td>`;
    });
    v2 += '</tr>';
  });
  v2 += '</table>';

  /* 7. ---------- 视图3 · 团队拥挤度 ---------- */
  let v3 = '<h2>结果3·团队拥挤度</h2><table class="result"><tr><th>BDM</th><th>Team Size</th><th>点位最大容量人数之和</th><th>团队拥挤度</th></tr>';
  teams.forEach(t => {
    const crowdPct = t.size ? (t.capSum / t.size * 100).toFixed(2) + '%' : '0%';
    v3 += `<tr><td>${t.bdm}</td><td>${t.size}</td><td>${t.capSum}</td><td>${crowdPct}</td></tr>`;
  });
  v3 += '</table>';

  /* 8. 输出结果 */
  document.getElementById('output').innerHTML = v1 + v2 + v3;
});
