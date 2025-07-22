/* ---------- 初始化两张 Handsontable ---------- */
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

/* ---------- 工具：生成所有子集 (位运算，N<=20 可接受) ---------- */
function subsetChoices(arr){
  const res=[];
  const n=arr.length;
  for(let mask=1; mask<(1<<n); mask++){
    const pick=[];
    for(let i=0;i<n;i++) if(mask&(1<<i)) pick.push(arr[i]);
    res.push(pick);
  }
  return res;
}

/* ---------- 主按钮 ---------- */
document.getElementById('genBtn').addEventListener('click',()=>{

  /* 1. 读取数据 */
  const locRaw = locHot.getData().filter(r=>r.some(c=>c));
  const teamRaw= teamHot.getData().filter(r=>r.some(c=>c));
  if(!locRaw.length||!teamRaw.length){alert('两张表都要粘贴数据！');return;}

  /* 2. 转换点位对象 */
  const locations = locRaw.map(r=>({
    name : r[1],
    cap  : Number(r[5])||0   // Max BD
  })).sort((a,b)=>b.cap-a.cap);  // 大→小

  /* 3. 团队对象 */
  const teams = teamRaw.map(r=>({
    bdm : r[0],
    size: Number(r[1])||0,
    capSum:0,
    locs:[]           // {week,name,cap}
  }));

  const weeks=['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];

  /* 4. 贪心 + 子集凑数，每队尽量精确 size */
  let locPool=[...locations];
  teams.forEach(t=>{
    // 尝试在当前 locPool 找到 capSum 最接近 size (>=)
    let best=null;
    const subsets=subsetChoices(locPool);
    subsets.forEach(pick=>{
      const sum=pick.reduce((s,x)=>s+x.cap,0);
      if(sum>=t.size){
        if(!best || sum<best.sum) best={sum,pick};
      }
    });
    // 若找到最优组合
    const use = best ? best.pick : [locPool[0]];   // 若无组合 (极少见)，先给最大cap
    use.forEach((loc,i)=>{
      t.locs.push({week:weeks[(i)%weeks.length],name:loc.name,cap:loc.cap});
      t.capSum+=loc.cap;
      // 从池中移除
      locPool = locPool.filter(l=>l!==loc);
    });
  });

  /* 5. 还剩点位 → 继续按 crowd% 高低分配 */
  const crowd = x=> x.capSum ? x.size/x.capSum : Infinity;
  locPool.forEach((loc,i)=>{
    teams.sort((a,b)=>crowd(b)-crowd(a));
    const t=teams[0];
    t.locs.push({week:weeks[(t.locs.length)%weeks.length],name:loc.name,cap:loc.cap});
    t.capSum+=loc.cap;
  });

  /* 6. 视图 1 · 点位维度 */
  let v1='<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w=>v1+=`<th>${w}</th>`);v1+='</tr>';
  locations.forEach(loc=>{
    v1+=`<tr><td>${loc.name}</td>`;
    weeks.forEach(w=>{
      const found=teams.find(t=>t.locs.find(l=>l.week===w&&l.name===loc.name));
      v1+=`<td>${found?found.bdm:''}</td>`;
    });
    v1+='</tr>';
  });v1+='</table>';

  /* 7. 视图 2 · 团队维度 */
  let v2='<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`);v2+='</tr>';
  teams.forEach(t=>{
    v2+=`<tr><td>${t.bdm}</td>`;
    weeks.forEach(w=>{
      const hit=t.locs.find(l=>l.week===w);
      v2+=`<td>${hit?hit.name:'/'}<\/td>`;
    });
    v2+='</tr>';
  });v2+='</table>';

  /* 8. 视图 3 · 团队拥挤度 + 点位数 */
  let v3='<h2>结果3·团队拥挤度</h2><table class="result"><tr><th>BDM</th><th>Team Size</th><th>点位数</th><th>点位最大容量人数之和</th><th>团队拥挤度</th></tr>';
  teams.forEach(t=>{
    const crowdPct = t.capSum? (t.size/t.capSum*100).toFixed(2)+'%':'∞';
    v3+=`<tr><td>${t.bdm}</td><td>${t.size}</td><td>${t.locs.length}</td><td>${t.capSum}</td><td>${crowdPct}</td></tr>`;
  });
  v3+='</table>';

  /* 9. 输出 */
  document.getElementById('output').innerHTML=v1+v2+v3;
});
