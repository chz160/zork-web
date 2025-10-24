import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Console } from './console/console';
import { GameEngineService } from './core/services/game-engine.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Console],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('zork-web');
  private readonly gameEngine = inject(GameEngineService);

  ngOnInit(): void {
    // Initialize the game engine
    this.gameEngine.initializeGame();
  }
}
