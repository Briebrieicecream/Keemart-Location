/* ---------- 初始化 Handsontable ---------- */
const locHot = new Handsontable(document.getElementById('locTable'),{
  data:[Array(6).fill('')],
  colHeaders:['Station','Location name','Sun-Wed BD','Thu-Sat BD','Security','Max BD'],
  rowHeaders:true,stretchH:'all',minSpareRows:5,
  licenseKey:'non-commercial-and-evaluation'
});

const teamHot = new Handsontable(document.getElementById('teamTable'),{
  data:[Array(2).fill('')],
  colHeaders:['BDM','Team Size'],
  rowHeaders:true,stretchH:'all',minSpareRows:5,
  licenseKey:'non-commercial-and-evaluation'
});

/* ---------- 工具：深拷贝 & crowd ---------- */
const clone = o => JSON.parse(JSON.stringify(o));
const crowd = t => t.cap ? t.size / t.cap : Infinity;

/* ---------- 主按钮 ---------- */
document.getElementById('genBtn').addEventListener('click',()=>{
  /* 1. 读取数据 */
  const locRows = locHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({name:r[1],cap:Number(r[5])||0}))
        .sort((a,b)=>b.cap-a.cap);                       // 大→小
  const teamRows = teamHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({bdm:r[0],size:Number(r[1])||0}));

  if(!locRows.length||!teamRows.length){alert('两张表都要粘贴数据！');return;}

  const weeks=['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];

  /* 2. 为 4 个周次分别做均衡分配 */
  const weekAssignments = {};                          // {week:[{loc,bdm,cap}]}
  const teamWeekStats   = {};                          // {week:{bdm:{locs[],cap}}}

  weeks.forEach(week=>{
    const teams = teamRows.map(r=>({bdm:r.bdm,size:r.size,cap:0,locs:[]}));
    let pool    = clone(locRows);                      // 每周都要全部点位

    // 贪心：优先不足，然后按 crowd% 最大
    pool.forEach(loc=>{
      // 找 cap<size 的团队；若都满足则找 crowd% 最大
      let tgt = teams.find(t=>t.cap<t.size);
      if(!tgt){
        teams.sort((a,b)=>crowd(b)-crowd(a));
        tgt = teams[0];
      }
      tgt.locs.push(loc);
      tgt.cap += loc.cap;
    });

    // 保存结果
    weekAssignments[week]=[];
    teamWeekStats[week]={};
    teams.forEach(t=>{
      t.locs.forEach(loc=>weekAssignments[week].push({...loc,bdm:t.bdm}));
      teamWeekStats[week][t.bdm]={locCount:t.locs.length,cap:t.cap,size:t.size};
    });
  });

  /* ---------- 视图 1 · 点位维度 ---------- */
  let v1='<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w=>v1+=`<th>${w}</th>`);v1+='</tr>';

  locRows.forEach(loc=>{
    v1+=`<tr><td>${loc.name}</td>`;
    weeks.forEach(w=>{
      const hit=weekAssignments[w].find(x=>x.name===loc.name);
      v1+=`<td>${hit?hit.bdm:''}</td>`;
    });
    v1+='</tr>';
  });
  v1+='</table>';

  /* ---------- 视图 2 · 团队维度 ---------- */
  let v2='<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`);v2+='</tr>';
  teamRows.forEach(tr=>{
    v2+=`<tr><td>${tr.bdm}</td>`;
    weeks.forEach(w=>{
      const entry=weekAssignments[w].find(l=>l.bdm===tr.bdm);
      v2+=`<td>${entry?entry.name:'/'}<\/td>`;
    });
    v2+='</tr>';
  });
  v2+='</table>';

  /* ---------- 视图 3 · 团队拥挤度（带筛选） ---------- */
  const makeCrowdTable=week=>{
    let html='<table class="result"><tr><th>BDM</th><th>Team Size</th><th>Location Amount</th><th>Cap Sum</th><th>Crowd%</th></tr>';
    teamRows.forEach(t=>{
      const s=teamWeekStats[week][t.bdm];
      const crowdPct = (s.size/s.cap*100).toFixed(2)+'%';
      html+=`<tr><td>${t.bdm}</td><td>${s.size}</td><td>${s.locCount}</td><td>${s.cap}</td><td>${crowdPct}</td></tr>`;
    });
    html+='</table>';
    return html;
  };

  let v3='<h2>结果3·团队拥挤度</h2>';
  v3+='<div class="filterBox">查看周次：<select id="weekSel">';
  weeks.forEach(w=>v3+=`<option value="${w}">${w}</option>`);v3+='</select></div>';
  v3+='<div id="crowdWrap"></div>';

  document.getElementById('output').innerHTML=v1+v2+v3;
  const crowdWrap=document.getElementById('crowdWrap');
  const weekSel=document.getElementById('weekSel');
  const renderWeek=()=>crowdWrap.innerHTML=makeCrowdTable(weekSel.value);
  weekSel.addEventListener('change',renderWeek);
  renderWeek();                                           // 默认显示第一周
});
