import { calcHealthLevel, calcTileType } from './utils';
import themes from './themes';
import cursors from './cursors';
import { generateTeam } from './generators';
import GameState from './GameState';
import GameStateService from './GameStateService';

export default class GamePlay {
  constructor() {
    this.boardSize = 8;
    this.container = null;
    this.boardEl = null;
    this.cells = [];
    this.cellClickListeners = [];
    this.cellEnterListeners = [];
    this.cellLeaveListeners = [];
    this.newGameListeners = [];
    this.saveGameListeners = [];
    this.loadGameListeners = [];
    this.gameStateService = new GameStateService(localStorage);
  }

  bindToDOM(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('container is not HTMLElement');
    }
    this.container = container;
  }

  /**
   * Draws boardEl with specific theme
   *
   * @param theme
   */
  drawUi(theme = themes.prairie) {
    this.checkBinding();

    this.container.innerHTML = `
      <div class="controls">
        <button data-id="action-restart" class="btn">New Game</button>
        <button data-id="action-save" class="btn">Save Game</button>
        <button data-id="action-load" class="btn">Load Game</button>
      </div>
      <p class="points">Points number: <span class="points-number">0</span></p>
      <div class="board-container">
        <div data-id="board" class="board"></div>
      </div>
    `;

    this.points = this.container.querySelector('.points-number');
    this.newGameEl = this.container.querySelector('[data-id=action-restart]');
    this.saveGameEl = this.container.querySelector('[data-id=action-save]');
    this.loadGameEl = this.container.querySelector('[data-id=action-load]');

    this.newGameEl.addEventListener('click',
      (event) => this.onNewGameClick(event));
    this.saveGameEl.addEventListener('click',
      (event) => this.onSaveGameClick(event));
    this.loadGameEl.addEventListener('click',
      (event) => this.onLoadGameClick(event));

    this.boardEl = this.container.querySelector('[data-id=board]');

    this.boardEl.classList.add(theme);
    for (let i = 0; i < this.boardSize ** 2; i += 1) {
      const cellEl = document.createElement('div');
      cellEl.classList.add(
        'cell',
        'map-tile',
        `map-tile-${calcTileType(i, this.boardSize)}`,
      );
      cellEl.addEventListener('mouseenter', (event) => this.onCellEnter(event));
      cellEl.addEventListener('mouseleave', (event) => this.onCellLeave(event));
      cellEl.addEventListener('click', (event) => this.onCellClick(event));
      this.boardEl.appendChild(cellEl);
    }

    this.cells = Array.from(this.boardEl.children);
  }

  /**
   * Draws positions (with chars) on boardEl
   *
   * @param positions array of PositionedCharacter objects
   */
  redrawPositions(positions) {
    for (const cell of this.cells) {
      cell.innerHTML = '';
    }

    for (const position of positions) {
      const cellEl = this.boardEl.children[position.position];
      const charEl = document.createElement('div');
      charEl.classList.add('character', position.character.type);

      const healthEl = document.createElement('div');
      healthEl.classList.add('health-level');

      const healthIndicatorEl = document.createElement('div');
      healthIndicatorEl.classList.add(
        'health-level-indicator',
        `health-level-indicator-${calcHealthLevel(position.character.health)}`,
      );
      healthIndicatorEl.style.width = `${position.character.health}%`;
      healthEl.appendChild(healthIndicatorEl);

      charEl.appendChild(healthEl);
      cellEl.appendChild(charEl);
    }
  }

  static checkUserType(type) {
    return [
      'swordsman',
      'bowman',
      'magician',
    ].includes(type);
  }

  static getTemplate(char) {
    const lvl = `\uD83C\uDF96${char.level}`;
    const atk = `\u2694${char.attack}`;
    const def = `\uD83D\uDEE1${char.defence}`;
    const hp = `\u2764${char.health}`;
    return [lvl, atk, def, hp].join(' ');
  }

  getDistance(startPosition, endPosition) {
    let distanceBetweenCells = Math.abs(startPosition - endPosition);
    const leftEdge = startPosition - (startPosition % this.boardSize);
    const rightEdge = leftEdge + this.boardSize - 1;
    const selectedPositionRest = startPosition % this.boardSize;
    const chosenPositionRest = endPosition % this.boardSize;

    if (endPosition < leftEdge || endPosition > rightEdge) {
      if (chosenPositionRest === selectedPositionRest) {
        distanceBetweenCells /= this.boardSize;
      } else {
        // left/right main diagonals divisors
        const divisor1 = endPosition < startPosition
          ? this.boardSize + 1
          : this.boardSize - 1;
        const divisor2 = endPosition < startPosition
          ? this.boardSize - 1
          : this.boardSize + 1;

        if (
          distanceBetweenCells % divisor1 === 0
          && chosenPositionRest < selectedPositionRest
        ) {
          distanceBetweenCells /= divisor1;
        } else if (
          distanceBetweenCells % divisor2 === 0
          && chosenPositionRest > selectedPositionRest
        ) {
          distanceBetweenCells /= divisor2;
        } else {
          distanceBetweenCells = undefined;
        }
      }
    }

    return distanceBetweenCells;
  }

  static getVisualActionParameters(
    selectedCharacter,
    chosenCharacter,
    distanceBetweenCells,
  ) {
    const result = {
      cursor: null,
      cellColor: null,
    };

    if (!selectedCharacter) {
      result.cursor = cursors.auto;
    } else if (
      chosenCharacter
      && distanceBetweenCells <= selectedCharacter.character.attackDistance
    ) {
      result.cursor = cursors.crosshair;
    } else if (
      !chosenCharacter
      && distanceBetweenCells <= selectedCharacter.character.moveDistance
    ) {
      result.cursor = cursors.pointer;
      result.cellColor = 'green';
    } else {
      result.cursor = cursors.notallowed;
    }

    return result;
  }

  attack() {
    const damage = Math.round(Math.max(
      this.selectedCharacter.character.attack - this.chosenCharacter.character.defence,
      this.selectedCharacter.character.attack * 0.1,
    ));
    this.chosenCharacter.character.health -= damage;
    const killedIndex = this.team.findIndex(
      (member) => member.character.health <= 0,
    );
    this.deselectCell(this.selectedUserPosition);
    this.boardEl.style.cursor = cursors.auto;

    let emptyCellIndex;
    let enemyCharactersStartIndex;

    if (killedIndex >= 0) {
      emptyCellIndex = this.team[killedIndex].position;
      this.team.splice(killedIndex, 1);
      enemyCharactersStartIndex = this.team.findIndex(
        (member) => !this.constructor.checkUserType(member.character.type),
      );
    }

    setTimeout(() => {
      if (
        this.chosenCharacter
        && this.chosenCharacter.position !== this.selectedCharacter.position
      ) {
        this.showDamage(this.chosenCharacter.position, damage);
      }
    }, 100);

    setTimeout(() => {
      if (emptyCellIndex) {
        this.deselectCell(emptyCellIndex);

        if (enemyCharactersStartIndex === -1) {
          this.levelUp();
        } else if (enemyCharactersStartIndex === 0) {
          this.cellClickListeners = [];
          this.cellEnterListeners = [];
          this.cellLeaveListeners = [];
          this.redrawPositions(this.team);
        } else {
          this.redrawPositions(this.team);
        }
      } else {
        this.redrawPositions(this.team);
      }
    }, 500);
  }

  enemyAction() {
    const enemyCharactersStartIndex = this.team.findIndex(
      (member) => !this.constructor.checkUserType(member.character.type),
    );
    const userCharacters = this.team.slice(0, enemyCharactersStartIndex);
    const enemyCharacters = this.team.slice(enemyCharactersStartIndex);

    // attack preparation
    let rivalsPairs = enemyCharacters.map((enemyChar) => {
      const target = userCharacters.reduce((acc, userChar) => {
        const distanceBetweenCells = this.getDistance(
          enemyChar.position,
          userChar.position,
        );

        let obj = acc;
        if (
          distanceBetweenCells <= enemyChar.character.attackDistance
          && userChar.character.health < acc.character.health
        ) {
          obj = userChar;
        }
        return obj;
      }, {
        character: {
          health: Infinity,
        },
      });

      return [
        enemyChar,
        target,
      ];
    });
    rivalsPairs = rivalsPairs.filter((pair) => pair[1].character.health !== Infinity);

    if (rivalsPairs.length !== 0) {
      // attack
      if (rivalsPairs.length > 1) {
        rivalsPairs.sort((a, b) => {
          const damageA = Math.max(
            a[0].character.attack - a[1].character.defence,
            a[0].character.attack * 0.1,
          );
          const damageB = Math.max(
            b[0].character.attack - b[1].character.defence,
            b[0].character.attack * 0.1,
          );
          let value = 0;
          if (damageA > damageB) {
            value = -1;
          }
          return value;
        });
      }

      [[this.selectedCharacter, this.chosenCharacter]] = rivalsPairs;
      this.attack();
    } else {
      // moving
      const randomEnemyCharacter = enemyCharacters[
        Math.floor(Math.random() * enemyCharacters.length)
      ];

      let newEnemyPosition;

      do {
        newEnemyPosition = this.getNewEnemyPosition(randomEnemyCharacter);
      } while (newEnemyPosition.valid === false);

      randomEnemyCharacter.position = newEnemyPosition.number;
      this.redrawPositions(this.team);
    }
  }

  getNewEnemyPosition(randomEnemyCharacter) {
    const randomEnemyDistance = Math.floor(
      Math.random()
      * randomEnemyCharacter.character.moveDistance
      + 1,
    );
    const randomEnemyDirection = Math.floor(Math.random() * this.boardSize);
    let endPoint = randomEnemyCharacter.position;
    let restrictionMark = 1;
    switch (randomEnemyDirection) {
      case 0:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint -= this.boardSize + 1;
        }
        break;
      case 1:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint -= this.boardSize;
        }
        break;
      case 2:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint -= this.boardSize - 1;
        }
        restrictionMark = 2;
        break;
      case 3:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint += 1;
        }
        restrictionMark = 2;
        break;
      case 4:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint += this.boardSize + 1;
        }
        restrictionMark = 2;
        break;
      case 5:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint += this.boardSize;
        }
        break;
      case 6:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint += this.boardSize - 1;
        }
        break;
      case 7:
        for (let i = 0; i < randomEnemyDistance; i += 1) {
          endPoint -= 1;
        }
        break;
      default:
        endPoint = Infinity;
        break;
    }

    const endPointIsValid = ((restrictionMark === 1
        && endPoint % 8 <= randomEnemyCharacter.position % 8)
        || (restrictionMark === 2
          && endPoint % 8 > randomEnemyCharacter.position % 8))
      && endPoint >= 0
      && endPoint < this.boardSize ** 2
      && !this.cells[endPoint].hasChildNodes();

    return {
      number: endPoint,
      valid: endPointIsValid,
    };
  }

  levelUp() {
    const nextLevel = this.team[0].character.level + 1;
    const newUserCharsLevels = [];
    let points = 0;
    let nextTheme;
    let themesValues;
    let randomTheme;

    switch (nextLevel) {
      case 2:
        nextTheme = themes.desert;
        newUserCharsLevels.push(Math.floor(Math.random() * nextLevel + 1));
        break;
      case 3:
        nextTheme = themes.arctic;
        newUserCharsLevels.push(
          Math.floor(Math.random() * nextLevel + 1),
          Math.floor(Math.random() * nextLevel + 1),
        );
        break;
      case 4:
        nextTheme = themes.mountain;
        newUserCharsLevels.push(
          Math.floor(Math.random() * nextLevel + 1),
          Math.floor(Math.random() * nextLevel + 1),
        );
        break;
      default:
        themesValues = Object.values(themes);
        randomTheme = themesValues[Math.floor(Math.random() * themesValues.length)];
        nextTheme = randomTheme;
        newUserCharsLevels.push(Math.floor(Math.random() * nextLevel + 1));
        newUserCharsLevels.push(Math.floor(Math.random() * nextLevel + 1));
    }

    const newTeam = generateTeam(
      nextLevel,
      (this.team.length + newUserCharsLevels.length) * 2,
      this.boardSize,
    );

    for (
      let i = this.team.length,
        limit = this.team.length + newUserCharsLevels.length;
      i < limit;
      i += 1
    ) {
      const { character } = newTeam[i];
      character.attack /= character.level;
      character.defence /= character.level;
      character.level = newUserCharsLevels[i - this.team.length];
      character.attack *= character.level;
      character.defence *= character.level;
      // умножить attack/defence на level
    }

    this.team.forEach((member, index) => {
      const { character } = member;
      character.level += 1;
      character.attack = Math.round(Math.max(
        character.attack,
        character.attack * (1.8 - character.health / 100),
      ));
      character.defence = Math.round(Math.max(
        character.defence,
        character.defence * (1.8 - character.health / 100),
      ));
      points += character.health;
      character.health = character.health <= 20
        ? character.health + 80
        : 100;
      newTeam[index].character = character;
    });

    points += GameState.points;

    this.drawUi(nextTheme);
    this.team = newTeam;
    this.redrawPositions(this.team);
    this.points.textContent = points;
    GameState.from({
      theme: nextTheme,
      team: this.team,
      points,
    });
  }

  getSavedGameState() {
    let loadedGameState;

    try {
      loadedGameState = Object.fromEntries(this.gameStateService.load());

      if (!Object.values(themes).includes(loadedGameState.theme)) {
        throw new Error('Error! Correct "theme" property data didn\'t loaded.');
      }

      if (!loadedGameState.team) {
        throw new Error('Error! "team" property didn\'t loaded.');
      }

      const teamDataIsValid = loadedGameState.team.every((member) => {
        let result = false;
        const memberKeys = Object.keys(member);
        if (
          memberKeys.length === 2
          && memberKeys.includes('character')
          && memberKeys.includes('position')
          && typeof member.character === 'object'
          && typeof member.position === 'number'
        ) {
          result = true;
        }
        return result;
      });

      if (!teamDataIsValid) {
        throw new Error('Error! Invalid data loaded in property "team".');
      }

      if (typeof loadedGameState.points !== 'number') {
        throw new Error('Error! Correct "points" property data didn\'t loaded.');
      }
    } catch (e) {
      throw new Error(e);
    }

    return loadedGameState;
  }

  /**
   * Add listener to mouse enter for cell
   *
   * @param callback
   */
  addCellEnterListener(callback) {
    this.cellEnterListeners.push(callback);
  }

  /**
   * Add listener to mouse leave for cell
   *
   * @param callback
   */
  addCellLeaveListener(callback) {
    this.cellLeaveListeners.push(callback);
  }

  /**
   * Add listener to mouse click for cell
   *
   * @param callback
   */
  addCellClickListener(callback) {
    this.cellClickListeners.push(callback);
  }

  /**
   * Add listener to "New Game" button click
   *
   * @param callback
   */
  addNewGameListener(callback) {
    this.newGameListeners.push(callback);
  }

  /**
   * Add listener to "Save Game" button click
   *
   * @param callback
   */
  addSaveGameListener(callback) {
    this.saveGameListeners.push(callback);
  }

  /**
   * Add listener to "Load Game" button click
   *
   * @param callback
   */
  addLoadGameListener(callback) {
    this.loadGameListeners.push(callback);
  }

  onCellEnter(event) {
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    this.cellEnterListeners.forEach((o) => o.call(null, index));
  }

  onCellLeave(event) {
    event.preventDefault();
    const index = this.cells.indexOf(event.currentTarget);
    this.cellLeaveListeners.forEach((o) => o.call(null, index));
  }

  onCellClick(event) {
    const index = this.cells.indexOf(event.currentTarget);
    this.cellClickListeners.forEach((o) => o.call(null, index));
  }

  onNewGameClick(event) {
    event.preventDefault();
    this.newGameListeners.forEach((o) => o.call(null));
  }

  onSaveGameClick(event) {
    event.preventDefault();
    this.saveGameListeners.forEach((o) => o.call(null));
  }

  onLoadGameClick(event) {
    event.preventDefault();
    this.loadGameListeners.forEach((o) => o.call(null));
  }

  static showError(message) {
    alert(message);
  }

  static showMessage(message) {
    alert(message);
  }

  selectCell(index, color = 'yellow') {
    this.deselectCell(index);
    this.cells[index].classList.add('selected', `selected-${color}`);
  }

  deselectCell(index) {
    const cell = this.cells[index];
    cell.classList.remove(
      ...Array.from(cell.classList).filter((o) => o.startsWith('selected')),
    );
  }

  showCellTooltip(message, index) {
    this.cells[index].title = message;
  }

  hideCellTooltip(index) {
    this.cells[index].title = '';
  }

  showDamage(index, damage) {
    return new Promise((resolve) => {
      const cell = this.cells[index];
      const damageEl = document.createElement('span');
      damageEl.textContent = damage;
      damageEl.classList.add('damage');
      cell.appendChild(damageEl);

      damageEl.addEventListener('animationend', () => {
        cell.removeChild(damageEl);
        resolve();
      });
    });
  }

  setCursor(cursor) {
    this.boardEl.style.cursor = cursor;
  }

  checkBinding() {
    if (this.container === null) {
      throw new Error('GamePlay not bind to DOM');
    }
  }
}
