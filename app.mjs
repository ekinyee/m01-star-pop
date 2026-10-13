import { newGame, play, groupAt, TARGET } from './core.mjs';

const words = {
  zh: { eyebrow:'一座星岛，一点好心情', title:'星屿消消', lead:'把相邻的同色星块连在一起，<br>在 20 步里，点亮你的小岛。', how1:'点击相邻同色星块', detail1:'至少 2 块即可消除，上下左右相连。', how2:'连得越多，分数越高', detail2:'大组消除能让进度条飞快上涨。', how3:'20 步，挑战 1200 分', detail3:'不赶时间，找到那一组漂亮的连击。', free:'免费试玩 · 无需登录 · 无广告', island:'你的星岛', round:'让星星连成一片。', score:'当前分数', moves:'剩余步数', best:'本机最高', target:'点亮目标', again:'再点亮一座岛', restart:'↻ 重新开始', privacy:'隐私说明', ready:'从一组相邻的星块开始吧。', single:'找至少 2 块相邻的同色星块。', won:'这座星岛，被你点亮了。', lost:'差一点，星光就在前面。', total:'本局得分', tiles:['绿叶','金星','紫花','蓝月'], board:'消除棋盘', progress:'目标进度', points:(n,p)=>`${n} 连消！ +${p} 分`, rescue:'已自动补上可消除的星块。' },
  en: { eyebrow:'A little island. A brighter day.', title:'Star Pop', lead:'Connect neighboring tiles of the same color.<br> Light up your island in 20 moves.', how1:'Tap a group of matching tiles', detail1:'Two or more, connected up, down, left or right.', how2:'Bigger groups, brighter scores', detail2:'Save a big group for a satisfying score boost.', how3:'20 moves. Reach 1,200 points.', detail3:'Take your time. Find your next lovely combo.', free:'Free to play · No login · No ads', island:'YOUR LITTLE ISLAND', round:'Make the stars shine together.', score:'SCORE', moves:'MOVES LEFT', best:'LOCAL BEST', target:'ISLAND PROGRESS', again:'Light up another island', restart:'↻ Restart', privacy:'Privacy', ready:'Start with a group of matching tiles.', single:'Find at least 2 neighboring matching tiles.', won:'You lit up this little island.', lost:'So close. Another island awaits.', total:'Your score', tiles:['Green leaf','Gold star','Purple flower','Blue moon'], board:'Game board', progress:'Goal progress', points:(n,p)=>`${n} tiles! +${p} points`, rescue:'A matching pair was restored automatically.' }
};
let language = 'en';
try { const saved = localStorage.getItem('m01-star-pop-language'); if(saved === 'en' || saved === 'zh') language = saved; } catch {}
let state = newGame(), busy = false, best = 0;
try { best = Math.max(0, Number(localStorage.getItem('m01-star-pop-best')) || 0); } catch {}
const board = document.getElementById('board'), message = document.getElementById('message');
const symbols = ['✿','✦','❖','☾'];
const t = () => words[language];

function updateText() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.title = language === 'zh' ? 'Star Pop · 星屿消消' : 'Star Pop';
  document.querySelectorAll('[data-i18n]').forEach(node => { const key = node.dataset.i18n; if (key === 'lead') node.innerHTML = t()[key]; else node.textContent = t()[key]; });
  document.querySelector('[data-i18n="title"]').textContent = language === 'en' ? 'Star' : t().title;
  document.getElementById('title-accent').textContent = language === 'en' ? 'Pop.' : 'Star Pop.';
  const toggle = document.getElementById('language');
  toggle.textContent = language === 'zh' ? 'EN ↗' : '中文 ↗';
  toggle.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
  board.setAttribute('aria-label',t().board);
  document.querySelector('.progress').setAttribute('aria-label',t().progress);
}

function render(focusIndex = null) {
  board.replaceChildren();
  state.board.forEach((line, row) => line.forEach((color, col) => {
    const tile = document.createElement('button');
    tile.className = 'tile'; tile.dataset.color = color; tile.dataset.row = row; tile.dataset.col = col;
    tile.textContent = symbols[color]; tile.disabled = state.status !== 'playing' || busy;
    tile.setAttribute('aria-label',`${t().tiles[color]} ${row + 1}, ${col + 1}`);
    tile.addEventListener('click',() => choose(row,col));
    tile.addEventListener('pointerenter',() => highlight(row,col));
    tile.addEventListener('pointerleave',clearHighlight);
    tile.addEventListener('keydown',event => {
      const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-6,ArrowDown:6}[event.key];
      if (delta !== undefined) { event.preventDefault(); const next = row * 6 + col + delta; if(next >= 0 && next < 36) board.children[next].focus(); }
    });
    board.append(tile);
  }));
  document.getElementById('score').textContent = state.score;
  document.getElementById('moves').textContent = state.moves;
  document.getElementById('best').textContent = best;
  document.getElementById('percent').textContent = Math.min(100,Math.floor(state.score / TARGET * 100));
  document.getElementById('progress-fill').style.width = `${Math.min(100,state.score / TARGET * 100)}%`;
  document.querySelector('.progress').setAttribute('aria-valuenow',Math.min(TARGET,state.score));
  const result = document.getElementById('result');
  result.hidden = state.status === 'playing';
  if(!result.hidden) {
    document.getElementById('result-title').textContent = t()[state.status];
    document.getElementById('result-detail').textContent = `${t().total}: ${state.score} / ${TARGET}`;
    document.getElementById('again').focus();
  } else if(focusIndex !== null) board.children[focusIndex]?.focus({preventScroll:true});
}

function clearHighlight() { board.querySelectorAll('.highlight').forEach(node => node.classList.remove('highlight')); }
function highlight(row,col) {
  if(busy || state.status !== 'playing') return;
  clearHighlight();
  const group = groupAt(state.board,row,col);
  if(group.length >= 2) group.forEach(([r,c])=>board.children[r*6+c].classList.add('highlight'));
}

async function choose(row,col) {
  if(busy) return;
  const keyboardFocus = document.activeElement === board.children[row*6+col];
  const outcome = play(state,row,col);
  if(!outcome.accepted) {
    message.textContent = t().single;
    const tile=board.children[row*6+col];tile.classList.remove('invalid');void tile.offsetWidth;tile.classList.add('invalid');return;
  }
  busy = true;
  board.querySelectorAll('button').forEach(node=>node.disabled=true);
  document.getElementById('restart').disabled=true;
  document.getElementById('language').disabled=true;
  outcome.group.forEach(([r,c])=>board.children[r*6+c].classList.add('popping'));
  await new Promise(resolve=>setTimeout(resolve,160));
  state=outcome.state;
  if(state.score>best) { best=state.score;try{localStorage.setItem('m01-star-pop-best',String(best));}catch{} }
  busy=false;document.getElementById('restart').disabled=false;document.getElementById('language').disabled=false;
  message.textContent = outcome.rescued ? t().rescue : t().points(outcome.group.length,outcome.points);
  render(keyboardFocus ? row*6+col : null);
}

function restart() { if(busy)return;state=newGame();message.textContent=t().ready;render(); }
document.getElementById('restart').addEventListener('click',restart);
document.getElementById('again').addEventListener('click',restart);
document.getElementById('language').addEventListener('click',()=>{language=language==='zh'?'en':'zh';try{localStorage.setItem('m01-star-pop-language',language);}catch{}updateText();message.textContent=t().ready;render();});
updateText();message.textContent=t().ready;render();
