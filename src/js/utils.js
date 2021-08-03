export function calcTileType(index, boardSize) {
  const tileNumber = index + 1;
  const lastTileNumber = boardSize ** 2;
  const leftBottomTileNumber = lastTileNumber - boardSize + 1;

  if (tileNumber <= boardSize) {
    switch (tileNumber) {
      case 1:
        return 'top-left';
      case boardSize:
        return 'top-right';
      default:
        return 'top';
    }
  } else if (tileNumber >= leftBottomTileNumber) {
    switch (tileNumber) {
      case leftBottomTileNumber:
        return 'bottom-left';
      case lastTileNumber:
        return 'bottom-right';
      default:
        return 'bottom';
    }
  } else {
    const remainder = tileNumber % boardSize;
    switch (remainder) {
      case 1:
        return 'left';
      case 0:
        return 'right';
      default:
        return 'center';
    }
  }
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
