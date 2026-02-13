Component({
  properties: {
    nickname: { type: String, value: '' },
    gender: { type: String, value: 'male' }, // 'male' or 'female'
    size: { type: Number, value: 48 }
  },
  data: {
    _initial: '',
    _genderClass: 'male',
    _sizeStyle: ''
  },
  observers: {
    'nickname, gender, size': function (nickname, gender, size) {
      const n = (nickname || '').trim();
      const initial = n ? n.charAt(0).toUpperCase() : '';
      const genderClass = (gender === 'female') ? 'female' : 'male';
      const s = Number(size) || 48;
      const sizePx = s + 'px';
      const fontSize = Math.floor(s * 0.5) + 'px';
      const style = `width:${sizePx};height:${sizePx};line-height:${sizePx};font-size:${fontSize};`;
      this.setData({ _initial: initial, _genderClass: genderClass, _sizeStyle: style });
    }
  }
});
