import { generateTeam } from './generators';
import GameState from './GameState';
import themes from './themes';
import cursors from './cursors';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this.gamePlay));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this.gamePlay));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this.gamePlay));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this.gamePlay));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this.gamePlay));
    GameState.from({
      theme: themes.prairie,
      team: generateTeam(1, 4, this.gamePlay.boardSize),
      points: 0,
    });
  }

  init() {
    this.gamePlay.team = GameState.team;
    this.gamePlay.drawUi(GameState.theme);
    this.gamePlay.redrawPositions(GameState.team);
    if (this.gamePlay.cellClickListeners.length === 0) {
      this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this.gamePlay));
      this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this.gamePlay));
      this.gamePlay.addCellClickListener(this.onCellClick.bind(this.gamePlay));
    }
  }

  onNewGameClick() {
    GameState.from({
      theme: themes.prairie,
      team: generateTeam(1, 4, this.gamePlay.boardSize),
    });
    this.init();
    this.gamePlay.points.textContent = GameState.points;
  }

  onSaveGameClick() {
    this.gameStateService.save(Object.entries(GameState));

    this.constructor.showInfoMessage(
      'Game saved',
      'Click the \'Load Game\' button to use your saved game.',
    );
  }

  onLoadGameClick() {
    const savedGameState = this.getSavedGameState();

    GameState.from({
      theme: savedGameState.theme,
      team: savedGameState.team,
      points: savedGameState.points,
    });

    this.team = GameState.team;
    this.drawUi(GameState.theme);
    this.redrawPositions(GameState.team);
    this.points.textContent = GameState.points;
  }

  onCellEnter(index) {
    this.selectedUserPosition = this.cells.findIndex(
      (cell) => cell.classList.contains('selected-yellow'),
    );

    this.chosenCharacter = undefined;
    let hasUserType;
    let choiceSelected;
    if (this.cells[index].hasChildNodes()) {
      this.chosenCharacter = this.team.find(
        (member) => member.position === index,
      );

      if (this.chosenCharacter) {
        hasUserType = this.constructor.checkUserType(
          this.chosenCharacter.character.type,
        );
        choiceSelected = this.cells[index].classList.contains('selected');
        this.showCellTooltip(
          this.constructor.getTemplate(this.chosenCharacter.character),
          index,
        );
      }
    }

    if (this.selectedUserPosition >= 0) {
      if (hasUserType && !choiceSelected) {
        this.setCursor(cursors.pointer);
      } else if (choiceSelected) {
        this.setCursor(cursors.auto);
      } else {
        const distanceBetweenCells = this.getDistance(
          this.selectedUserPosition,
          index,
        );

        this.selectedCharacter = this.team.find(
          (member) => member.position === this.selectedUserPosition,
        );

        const visualActionParameters = this.constructor.getVisualActionParameters(
          this.selectedCharacter,
          this.chosenCharacter,
          distanceBetweenCells,
        );

        this.setCursor(visualActionParameters.cursor);

        if (visualActionParameters.cellColor) {
          this.selectCell(index, visualActionParameters.cellColor);
        }
      }
    } else if (hasUserType) {
      this.setCursor(cursors.pointer);
    } else {
      this.setCursor(cursors.auto);
    }
  }

  onCellLeave(index) {
    this.hideCellTooltip(index);
    const isYellowCell = this.cells[index].classList.contains('selected-yellow');
    if (!isYellowCell) {
      this.deselectCell(index);
    }
  }

  onCellClick(index) {
    if (this.cells[index].hasChildNodes()) {
      const chosenType = this.cells[index].firstChild.classList[1];

      if (this.constructor.checkUserType(chosenType)) {
        this.team.forEach((member) => {
          if (this.constructor.checkUserType(member.character.type)) {
            this.deselectCell(member.position);
          }
        });

        this.selectCell(index);
      } else if (this.boardEl.style.cursor === cursors.crosshair) {
        this.attack();

        // computer turn
        setTimeout(() => {
          this.enemyAction();
          GameState.from({ team: this.team });
        }, 300);
      } else if (this.boardEl.style.cursor === cursors.notallowed) {
        this.constructor.showWarningMessage(
          'The distance is too great to attack!',
        );
      } else {
        this.constructor.showWarningMessage(
          'You can\'t select enemy character!',
        );
      }
    } else {
      const isGreenCell = this.cells[index].classList.contains('selected-green');

      if (isGreenCell) {
        this.selectedCharacter.position = index;
        this.deselectCell(this.selectedUserPosition);
        this.deselectCell(index);
        this.boardEl.style.cursor = cursors.auto;
        this.redrawPositions(this.team);

        // computer turn
        setTimeout(() => {
          this.enemyAction();
          GameState.from({ team: this.team });
        }, 300);
      }
    }
  }
}
