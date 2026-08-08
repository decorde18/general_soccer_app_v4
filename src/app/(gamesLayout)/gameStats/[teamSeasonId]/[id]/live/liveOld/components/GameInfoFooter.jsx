function GameInfoFooter({ game, gameStage }) {
  if (!game) return null;

  return (
    <div className='bg-background p-4 rounded-lg border border-border mt-auto'>
      <div className='grid grid-cols-2 gap-4 text-sm'>
        <div>
          <span className='text-muted'>Home:</span>{" "}
          <span className='font-semibold text-text'>
            {game.home_club_name} {game.home_team_name}
          </span>
        </div>
        <div>
          <span className='text-muted'>Away:</span>{" "}
          <span className='font-semibold text-text'>
            {game.away_club_name} {game.away_team_name}
          </span>
        </div>
        <div>
          <span className='text-muted'>Score:</span>{" "}
          <span className='font-semibold text-text'>
            {game.goalsFor || 0} - {game.goalsAgainst || 0}
          </span>
        </div>
        <div>
          <span className='text-muted'>Stage:</span>{" "}
          <span className='font-semibold text-text'>
            {gameStage?.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GameInfoFooter;
