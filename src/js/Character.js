export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 1;
    this.type = type;
    this.moveDistance = 0;
    this.attackDistance = 0;
    if (new.target.name === 'Character') {
      throw Error('"new Character()" call is forbidden');
    }
    // TODO: throw error if user use "new Character()"
  }
}
