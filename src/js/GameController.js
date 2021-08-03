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
    GameState.from({
      theme: themes.prairie,
      team: generateTeam(1, 4),
      points: 0,
    });
  }

  init() {
    this.gamePlay.team = GameState.team;
    this.gamePlay.drawUi(GameState.theme);
    this.gamePlay.redrawPositions(GameState.team);
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this.gamePlay));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this.gamePlay));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this.gamePlay));
    // TODO: add event listeners to gamePlay events
    // TODO: load saved stated from stateService
  }

  onNewGameClick() {
    GameState.from({
      theme: themes.prairie,
      team: generateTeam(1, 4),
    });
    this.init();
  }

  onSaveGameClick() {
    this.gameStateService.save(Object.entries(GameState));
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
    // TODO: react to mouse enter
  }

  onCellLeave(index) {
    this.hideCellTooltip(index);
    const isYellowCell = this.cells[index].classList.contains('selected-yellow');
    if (!isYellowCell) {
      this.deselectCell(index);
    }
    // TODO: react to mouse leave
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
        }, 100);
      } else {
        this.constructor.showError(
          'Ошибка! Нельзя выбрать персонажа противника.',
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
        this.enemyAction();
        GameState.from({ team: this.team });
      }
    }
    // TODO: react to click
  }
}
