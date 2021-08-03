import GamePlay from '../GamePlay';
import Bowman from '../characters/Bowman';
import PositionedCharacter from '../PositionedCharacter';

const bowman = new Bowman(1);

test('getTemplate method should return correct template', () => {
  const result = GamePlay.getTemplate(bowman);
  const expected = `\uD83C\uDF96${bowman.level} \u2694${bowman.attack} \uD83D\uDEE1${bowman.defence} \u2764${bowman.health}`;
  expect(result).toBe(expected);
});

const gamePlay = new GamePlay();

test('getDistance method should return correct distance', () => {
  expect(gamePlay.getDistance(31, 33, 8)).not.toBeDefined();
  expect(gamePlay.getDistance(35, 25, 8)).not.toBeDefined();
  expect(gamePlay.getDistance(35, 54, 8)).not.toBeDefined();
  expect(gamePlay.getDistance(47, 26, 8)).not.toBeDefined();
  expect(gamePlay.getDistance(26, 29, 8)).toBe(3);
  expect(gamePlay.getDistance(29, 26, 8)).toBe(3);
  expect(gamePlay.getDistance(17, 3, 8)).toBe(2);
  expect(gamePlay.getDistance(28, 42, 8)).toBe(2);
  expect(gamePlay.getDistance(28, 10, 8)).toBe(2);
  expect(gamePlay.getDistance(28, 46, 8)).toBe(2);
  expect(gamePlay.getDistance(27, 11, 8)).toBe(2);
  expect(gamePlay.getDistance(27, 43, 8)).toBe(2);
});

const member = new PositionedCharacter(bowman, 0);

test('getVisualActionParameters method should return correct parameters', () => {
  expect(GamePlay.getVisualActionParameters(false, true, 2)).toEqual({
    cursor: 'auto',
    cellColor: null,
  });
  expect(GamePlay.getVisualActionParameters(member, true, 2)).toEqual({
    cursor: 'crosshair',
    cellColor: null,
  });
  expect(GamePlay.getVisualActionParameters(member, false, 2)).toEqual({
    cursor: 'pointer',
    cellColor: 'green',
  });
  expect(GamePlay.getVisualActionParameters(member, true, 3)).toEqual({
    cursor: 'not-allowed',
    cellColor: null,
  });
  expect(GamePlay.getVisualActionParameters(member, false, 3)).toEqual({
    cursor: 'not-allowed',
    cellColor: null,
  });
});

test('GamePlay should handle loading errors', () => {
  let data = [
    ['theme', 'prairie'],
    ['team',
      [
        {
          character: {},
          position: 0,
        },
      ],
    ],
    ['points', 0],
  ];
  jest.spyOn(gamePlay.gameStateService, 'load').mockImplementation(() => data);
  expect(gamePlay.gameStateService.load()).toEqual(data);
  const result = () => gamePlay.getSavedGameState();
  expect(result).not.toThrow();

  data.splice(0, 1);
  let error = () => gamePlay.getSavedGameState();
  expect(error).toThrow('Error! Correct "theme" property data didn\'t loaded.');

  data = [
    ['theme', 'prairie'],
    ['points', 0],
  ];
  error = () => gamePlay.getSavedGameState();
  expect(error).toThrow('Error! "team" property didn\'t loaded.');

  data = [
    ['theme', 'prairie'],
    ['team',
      [
        {
          character: {},
          position: 'Hello',
        },
      ],
    ],
  ];
  error = () => gamePlay.getSavedGameState();
  expect(error).toThrow('Error! Invalid data loaded in property "team".');

  data = [
    ['theme', 'prairie'],
    ['team',
      [
        {
          character: {},
          position: 0,
        },
      ],
    ],
  ];
  error = () => gamePlay.getSavedGameState();
  expect(error).toThrow('Error! Correct "points" property data didn\'t loaded.');

  data = 'Hello';
  error = () => gamePlay.getSavedGameState();
  expect(error).toThrow();

  data = 1;
  error = () => gamePlay.getSavedGameState();
  expect(error).toThrow();
});
