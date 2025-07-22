/* -------- Location 表 -------- */
const locHot = new Handsontable(document.getElementById('locTable'), {
  data: [Array(6).fill('')],
  colHeaders: ['Station','Location Code','Sun-Wed BD','Thu-Sat BD','Security Index','Max BD'],
  rowHeaders: true, stretchH: 'all', minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* -------- Team 表 -------- */
const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data: [Array(2).fill('')],
  colHeaders: ['BDM','Team Size'],
  rowHeaders: true, stretchH: 'all', minSpareRows: 5,
  licenseKey: 'non-commercial-and-evaluation'
});

/* -------- 生成排班 -------- */
document.getElementById('genBtn').addEventListener('click', () => {

  /* 1. 读数据，过滤空行 */
  const loc = locHot.getData().filter(r => r.some(c => c));
  const teamsRaw = teamHot.getData().filter(r => r.some(c => c));
  if (!loc.length || !teamsRaw.length) { alert('两张表都要填数据'); return; }

  /* 2. 构建团队对象 */
  const teams = teamsRaw.map(r => ({
    bdm   : r[0],
    size  : Number(r[1])||0,
    assign: [],          // {week, loc, cap}
    capSum: 0
  }));

  const weeks = ['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];

  /* 3. 轮流分配点位 */
  loc.forEach((row,i) => {
    const t = teams[i % teams.length];
    const cap = Number(row[5])||0;
    t.assign.push({ week: weeks[i % weeks.length], loc: row[1], cap });
    t.capSum += cap;
  });

  /* 4. ========= 视图 1 · 点位维度 ========= */
  let v1 = '<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w => v1 += `<th>${w}</th>`); v1 += '</tr>';

  loc.forEach((row,i) => {
    v1 += `<tr><td>${row[1]}</td>`;
    weeks.forEach(w=>{
      const a = teams.find(t=>t.assign.find(x=>x.week===w && x.loc===row[1]));
      v1 += `<td>${a ? a.bdm : ''}</td>`;
    });
    v1 += '</tr>';
  }); v1 += '</table>';

  /* 5. ========= 视图 2 · 团队维度 ========= */
  let v2 = '<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`); v2+='</tr>';

  teams.forEach(t=>{
    v2 += `<tr><td>${t.bdm}</td>`;
    weeks.forEach(w=>{
      const hit = t.assign.find(a=>a.week===w);
      v2 += `<td>${hit ? hit.loc : '/'}</td>`;
    });
    v2 += '</tr>';
  }); v2 += '</table>';

  /* 6. ========= 视图 3 · 拥挤度 ========= */
  let v3 = '<h2>结果3·团队拥挤度</h2><table class="result"><tr><th>BDM</th><th>Team Size</th><th>点位最大容量人数之和</th><th>团队拥挤度</th></tr>';
  teams.forEach(t=>{
    const crowd = t.size ? (t.capSum / t.size * 100).toFixed(2)+'%' : '0%';
    v3 += `<tr><td>${t.bdm}</td><td>${t.size}</td><td>${t.capSum}</td><td>${crowd}</td></tr>`;
  });
  v3 += '</table>';

  /* 7. 输出 & 页面留白 */
  document.getElementById('output').innerHTML = v1 + v2 + v3;
  document.getElementById('output').style.marginTop = '40px';   // 留足空隙
});
