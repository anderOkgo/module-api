export const cyfer = () => {
  let p1: number;
  let p2: number;
  let p3: number;
  let nc: any = '';
  let li: number;

  const cy = (str: string, key: string) => {
    str = str.split('').reverse().join('');
    for (let x = 0; x < str.length; x++) {
      p1 = str.charCodeAt(x) + key.charCodeAt(li);
      p2 = ((p1 & 240) / 16) | 48;
      p3 = (p1 & 15) | 48;
      nc += String.fromCharCode(p2) + String.fromCharCode(p3);
      li++;
      if (li > key.length - 1) li = 0;
    }
    return Buffer.from(nc).toString('base64').replaceAll('O', '-');
  };

  const dcy = (str: string, key: string) => {
    str = Buffer.from(str, 'base64').toString().replaceAll('-', 'O').split('').reverse().join('');
    for (let x = str.length; x >= 2; x -= 2) {
      p2 = str.charCodeAt(x - 1) & 15;
      p3 = str.charCodeAt(x - 2) & 15;
      p1 = ((p2 * 16) | p3) - key.charCodeAt(li);
      if (p1 < 0) p1 = p1 * -1;
      nc += String.fromCharCode(p1);
      li++;
      if (li > key.length - 1) li = 0;
    }
    return nc.split('').reverse().join('');
  };

  return { cy, dcy };
};

export default cyfer;
