/* ============== 初始化两张表（保持不变，可复制你现用的） ============== */
const locHot  = new Handsontable(document.getElementById('locTable'), {
  data:[Array(6).fill('')], colHeaders:['Station','Location Code','Sun-Wed BD','Thu-Sat BD','Security','Max BD'],
  rowHeaders:true, stretchH:'all', minSpareRows:5, licenseKey:'non-commercial-and-evaluation'
});
const teamHot = new Handsontable(document.getElementById('teamTable'), {
  data:[Array(2).fill('')], colHeaders:['BDM','Team Size'],
  rowHeaders:true, stretchH:'all', minSpareRows:5, licenseKey:'non-commercial-and-evaluation'
});

/* ======================= 核心排班算法 ======================= */
document.getElementById('genBtn').addEventListener('click', () => {

  /* 1. 读取数据 */
  const locRows  = locHot.getData().filter(r=>r.some(c=>c));
  const teamRows = teamHot.getData().filter(r=>r.some(c=>c));
  if (!locRows.length || !teamRows.length){ alert('两张表都要粘贴数据'); return; }

  /* 2. 点位数组（降序按 Max BD 排，方便先分大点位） */
  const locations = locRows.map(r=>({
    station : r[0],
    name    : r[1],
    maxCap  : Number(r[5])||0
  })).sort((a,b)=>b.maxCap-a.maxCap);

  /* 3. BDM 对象 */
  const bdms = teamRows.map(r=>({
    bdm   : r[0],
    size  : Number(r[1])||0,
    weeks : [[],[],[],[]],   // 每周分到的点位
    capSum: 0                // 总容量
  }));

  const weeks = ['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];

  /* 4. 逐周分配 */
  weeks.forEach((weekLabel,wIdx)=>{

    // 4-1. 本周点位列表（克隆 & 打散顺序，避免每周都同样先分大）
    const pool = [...locations];
    if (wIdx % 2) pool.reverse();

    // 4-2. 本周循环分点位
    while (pool.length){
      // 取容量最大的点位
      const loc = pool.shift();
      // 找到“当前 crowd% 最低”的 BDM
      bdms.sort((a,b)=>(a.capSum/a.size) - (b.capSum/b.size));
      let target = null;
      for (const t of bdms){
        // 本周同一 BDM 不重复同 Station
        if (!t.weeks[wIdx].find(l=>l.station===loc.station)){ target = t; break; }
      }
      // 如果所有 BDM 同 Station 冲突，就无视冲突给最少 crowd 的
      if (!target) target = bdms[0];

      // 分配
      target.weeks[wIdx].push(loc);
      target.capSum += loc.maxCap;
    }

    // 4-3. 下周开始前把 BDM 顺序循环右移一格（轮转责任）
    bdms.unshift(bdms.pop());
  });

  /* 5. ==== 视图 1 · 点位维度 ==== */
  let v1='<h2>结果1·排班-点位维度</h2><table class=\"result\"><tr><th>Location name</th>';
  weeks.forEach(w=>v1+=`<th>${w}</th>`); v1+='</tr>';
  locations.forEach(loc=>{
    v1+=`<tr><td>${loc.name}</td>`;
    weeks.forEach((_,wi)=>{
      const hit = bdms.find(b=>b.weeks[wi].includes(loc));
      v1+=`<td>${hit?hit.bdm:''}</td>`;
    });
    v1+='</tr>';
  }); v1+='</table>';

  /* 6. ==== 视图 2 · 团队维度 ==== */
  let v2='<h2>视图2·排班-团队维度</h2><table class=\"result\"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`); v2+='</tr>';
  bdms.forEach(b=>{
    v2+=`<tr><td>${b.bdm}</td>`;
    weeks.forEach((_,wi)=>{
      const cell = b.weeks[wi].map(l=>l.name).join(', ') || '/';
      v2+=`<td>${cell}</td>`;
    });
    v2+='</tr>';
  }); v2+='</table>';

  /* 7. ==== 视图 3 · 拥挤度 ==== */
  let v3='<h2>结果3·团队拥挤度</h2><table class=\"result\"><tr><th>BDM</th><th>Team Size</th><th>点位最大容量人数之和</th><th>团队拥挤度</th></tr>';
  bdms.sort((a,b)=>a.bdm.localeCompare(b.bdm)).forEach(b=>{
    const crowd=(b.capSum/b.size*100).toFixed(2)+'%';
    v3+=`<tr><td>${b.bdm}</td><td>${b.size}</td><td>${b.capSum}</td><td>${crowd}</td></tr>`;
  }); v3+='</table>';

  /* 8. 输出 + 留白 */
  const out = document.getElementById('output');
  out.innerHTML = v1 + v2 + v3;
  out.style.marginTop='48px';   // 跟按钮拉开距离
});
