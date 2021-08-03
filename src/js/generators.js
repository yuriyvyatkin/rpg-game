/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
import Swordsman from './characters/Swordsman';
import Bowman from './characters/Bowman';
import Magician from './characters/Magician';
import Daemon from './characters/Daemon';
import Undead from './characters/Undead';
import Vampire from './characters/Vampire';
import PositionedCharacter from './PositionedCharacter';

export function* characterGenerator(allowedTypes, maxLevel) {
  while (true) {
    const randomTypeNumber = Math.floor(Math.random() * allowedTypes.length);
    const randomLevel = Math.floor(Math.random() * maxLevel) + 1;
    const randomType = new allowedTypes[randomTypeNumber](randomLevel);
    yield randomType;
  }
  // TODO: write logic here
}

export function generateTeam(maxLevel, characterCount) {
  const allowedTypes = [Swordsman, Bowman, Magician, Daemon, Undead, Vampire];
  const boardSize = 8;
  const totalNumberTiles = boardSize ** 2;
  const subTeamLimit = characterCount > boardSize * 4
    ? boardSize * 2
    : characterCount / 2;

  const userTeam = [];
  let userTypes;
  if (maxLevel === 1) {
    userTypes = ['swordsman', 'bowman'];
  } else {
    userTypes = ['swordsman', 'bowman', 'magician'];
  }
  const userPositions = [];
  for (let i = 0; i < totalNumberTiles; i += boardSize) {
    userPositions.push(i, i + 1);
  }

  const enemyTeam = [];
  const enemyPositions = [];
  for (let i = boardSize; i <= totalNumberTiles; i += boardSize) {
    enemyPositions.push(i - 2, i - 1);
  }

  const generator = characterGenerator(allowedTypes, maxLevel);

  do {
    const { value } = generator.next();
    const isUserType = userTypes.some((type) => type === value.type);
    let position;

    if (
      isUserType
      && userTeam.length !== subTeamLimit
    ) {
      const index = Math.floor(Math.random() * userPositions.length);
      position = userPositions[index];
      userPositions.splice(index, 1);
      userTeam.push(new PositionedCharacter(value, position));
    } else if (
      !isUserType
      && value.type !== 'magician'
      && enemyTeam.length !== subTeamLimit
    ) {
      const index = Math.floor(Math.random() * enemyPositions.length);
      position = enemyPositions[index];
      enemyPositions.splice(index, 1);
      enemyTeam.push(new PositionedCharacter(value, position));
    }
  } while ((userTeam.length < subTeamLimit) || (enemyTeam.length < subTeamLimit));

  return [...userTeam, ...enemyTeam];
  // TODO: write logic here
}
