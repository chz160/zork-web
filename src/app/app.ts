import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Console } from './console/console';
import { Input } from './input/input';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Console, Input],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('zork-web');
  private readonly gameService = inject(GameService);

  ngOnInit(): void {
    // Initialize the game via GameService
    this.gameService.initializeGame();
  }
}
