export default class GameState {
  static from(data) {
    this.theme = typeof data.theme === 'string'
      ? data.theme
      : this.theme;
    this.team = data.team || this.team;
    this.points = typeof data.points === 'number'
      ? data.points
      : this.points;
    // TODO: create object
    return null;
  }
}
