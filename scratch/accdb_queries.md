# Legacy MS Access Database Queries Audit
Total queries: 236

## Standard / Stored Queries (73 queries)

### Query: BeepPlayerResults
``sql
SELECT PlayerTable.PlayerFullName, SeasonTable.Season, BeepResults.RunNo, BeepResults.EndRun
FROM (SeasonTable INNER JOIN (PlayerTable INNER JOIN BeepResults ON PlayerTable.PlayerID = BeepResults.PlayerID) ON SeasonTable.SeasonID = BeepResults.SeasonID) INNER JOIN PlayerSeasonTable ON (PlayerTable.PlayerID = PlayerSeasonTable.[Player#]) AND (SeasonTable.SeasonID = PlayerSeasonTable.SeasonID)
GROUP BY PlayerTable.PlayerFullName, SeasonTable.Season, BeepResults.RunNo, BeepResults.EndRun
ORDER BY PlayerTable.PlayerFullName, BeepResults.EndRun DESC;
``

### Query: GameDetailsPeriodsQuery
``sql
SELECT GamesTable.*, SeasonTable.Season, LocationTable.Location, GameTypesTable.GameType, GameTypesTable.TimeOfSeason, GameTypesTable.TimeOfSeason2, GameTypesTable.TimeOfSeason3, DCount("[GameEventID]","Games_Ingame_Event_times"," [Gameid]=" & [GameID] & " and [event]=1") AS GoalsScored, DCount("[GameEventID]","Games_Ingame_Event_times"," [Gameid]=" & [GameID] & " and [event]=2") AS GoalsConceded, Int(IIf([PeriodEndTime]>0,IIf([PeriodStartTime]>0,TimeValue([PeriodendTime])*86400-TimeValue([PeriodstartTime])*86400-Nz([periodstoppedtime]),0),IIf([PeriodStartTime]>0,TimeValue(Time())*86400-TimeValue([PeriodStartTime])*86400-Nz([periodstoppedtime],0),0))) AS PeriodLength, IIf([period]>0,Nz(DSum("stoppedtime","games_ingame_event_times","[periodeventtime]=" & [Period] & " and [gameid]=" & [GameID]),0),0) AS periodstoppedtime, GamesInfoTimes.Period, GamesInfoTimes.PeriodStartTime, GamesInfoTimes.PeriodEndTime
FROM HighSchoolsTable INNER JOIN (GameTypesTable INNER JOIN ((SeasonTable INNER JOIN (LocationTable INNER JOIN GamesTable ON LocationTable.LocationID = GamesTable.LocationIDGames) ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) LEFT JOIN GamesInfoTimes ON GamesTable.GameID = GamesInfoTimes.[GameGameInfoTimesID]) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent
WHERE (((GameTypesTable.TimeOfSeason3)=2 Or (GameTypesTable.TimeOfSeason3)=3))
ORDER BY GamesTable.GameID, GamesInfoTimes.Period DESC;
``

### Query: GameDetailsPeriodsQueryForStats
``sql
SELECT GamesTable.*, SeasonTable.Season, LocationTable.Location, GameTypesTable.GameType, GameTypesTable.TimeOfSeason, GameTypesTable.TimeOfSeason2, GameTypesTable.TimeOfSeason3, DCount("[GameEventID]","Games_Ingame_Event_times"," [Gameid]=" & [GameID] & " and [event]=1") AS GoalsScored, DCount("[GameEventID]","Games_Ingame_Event_times"," [Gameid]=" & [GameID] & " and [event]=2") AS GoalsConceded, Int(IIf([PeriodEndTime]>0,IIf([PeriodStartTime]>0,[PeriodTotalTime]-Nz([periodstoppedtime]),0),IIf([PeriodStartTime]>0,[PeriodTotalTime]-Nz([periodstoppedtime]),0))) AS PeriodLength, GameDetailsPeriodsTimesQuery.periodstoppedtime, GameDetailsPeriodsTimesQuery.PeriodStartTime, GameDetailsPeriodsTimesQuery.PeriodEndTime, GameDetailsPeriodsTimesQuery.Period, GameDetailsPeriodsTimesQuery.PeriodTotalTime
FROM HighSchoolsTable INNER JOIN (GameTypesTable INNER JOIN (GameDetailsPeriodsTimesQuery INNER JOIN (SeasonTable INNER JOIN (LocationTable INNER JOIN GamesTable ON LocationTable.LocationID = GamesTable.LocationIDGames) ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) ON GameDetailsPeriodsTimesQuery.[GameTimesGame#] = GamesTable.[GameID]) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent
WHERE (((GameTypesTable.TimeOfSeason3)=2 Or (GameTypesTable.TimeOfSeason3)=3))
ORDER BY GamesTable.GameID, GameDetailsPeriodsTimesQuery.Period;
``

### Query: GameDetailsPeriodsTimesQuery
``sql
SELECT GamesInfoTimes.GameGameInfoTimesID AS [GameTimesGame#], GamesInfoTimes.Period, Sum(Nz([StoppedTime],0)) AS periodstoppedtime, GamesInfoTimes.PeriodStartTime, Int(TimeValue([PeriodEndTime])*86400)-Int(TimeValue([PeriodstartTime])*86400) AS PeriodTotalTime, GamesInfoTimes.PeriodEndTime
FROM GamesInfoTimes LEFT JOIN Games_InGame_Event_Times ON (GamesInfoTimes.[GameGameInfoTimesID] = Games_InGame_Event_Times.[GameID]) AND (GamesInfoTimes.Period = Games_InGame_Event_Times.PeriodEventTime)
GROUP BY GamesInfoTimes.GameGameInfoTimesID, GamesInfoTimes.Period, GamesInfoTimes.PeriodStartTime, GamesInfoTimes.PeriodEndTime;
``

### Query: GameDetailsQuery
``sql
SELECT GamesTable.*, HighSchoolsTable.HighSchoolName, SeasonTable.Season, LocationTable.Location, GameTypesTable.GameType, GameTypesTable.TimeOfSeason, GameTypesTable.TimeOfSeason2, GameTypesTable.TimeOfSeason3, Nz(DSum("[PeriodLength]","GameDetailsPeriodsQuery","[GameID]=" & [GameID])) AS TotalGameTime, DCount("[GameEventID]","Games_Ingame_Event_times"," [GameID]=" & [GameID] & " and [event]=1") AS GoalsScored, DCount("[GameEventID]","Games_Ingame_Event_times"," [GameID]=" & [GameID] & " and [event]=2") AS GoalsConceded, SeasonTable.SchoolYear
FROM HighSchoolsTable INNER JOIN (GameTypesTable INNER JOIN (SeasonTable INNER JOIN (LocationTable INNER JOIN GamesTable ON LocationTable.LocationID = GamesTable.LocationIDGames) ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent;
``

### Query: GameDetailsQuery_ShootoutResult
``sql
SELECT ShootoutTable.[Game#], Sum(ShootoutTable.OppResult) AS SumOfOppResult, Sum(ShootoutTable.Result) AS SumOfResult
FROM ShootoutTable
GROUP BY ShootoutTable.[Game#];
``

### Query: GameDetailsQueryForStats
``sql
SELECT GameDetailsPeriodsQueryForStats.GameID, GameDetailsPeriodsQueryForStats.SeasonIDGames, GameDetailsPeriodsQueryForStats.Date, GameDetailsPeriodsQueryForStats.Opponent, GameDetailsPeriodsQueryForStats.Class, GameDetailsPeriodsQueryForStats.LocationIDGames, GameDetailsPeriodsQueryForStats.HomeGame, GameDetailsPeriodsQueryForStats.DistrictMatch, GameDetailsPeriodsQueryForStats.CornersFor, GameDetailsPeriodsQueryForStats.CornersAgainst, GameDetailsPeriodsQueryForStats.FoulsFor, GameDetailsPeriodsQueryForStats.FoulsAgainst, GameDetailsPeriodsQueryForStats.OffsideFor, GameDetailsPeriodsQueryForStats.OffsideAgainst, GameDetailsPeriodsQueryForStats.Season, GameDetailsPeriodsQueryForStats.Location, GameDetailsPeriodsQueryForStats.GameType, GameDetailsPeriodsQueryForStats.TimeOfSeason, GameDetailsPeriodsQueryForStats.TimeOfSeason2, GameDetailsPeriodsQueryForStats.TimeOfSeason3, Sum(GameDetailsPeriodsQueryForStats.PeriodLength) AS SumOfPeriodLength, Count(GameDetailsPeriodsQueryForStats.Period) AS CountOfPeriod, GameDetailsPeriodsQueryForStats.GoalsScored, GameDetailsPeriodsQueryForStats.GoalsConceded
FROM GameDetailsPeriodsQueryForStats
GROUP BY GameDetailsPeriodsQueryForStats.GameID, GameDetailsPeriodsQueryForStats.SeasonIDGames, GameDetailsPeriodsQueryForStats.Date, GameDetailsPeriodsQueryForStats.Opponent, GameDetailsPeriodsQueryForStats.Class, GameDetailsPeriodsQueryForStats.LocationIDGames, GameDetailsPeriodsQueryForStats.HomeGame, GameDetailsPeriodsQueryForStats.DistrictMatch, GameDetailsPeriodsQueryForStats.CornersFor, GameDetailsPeriodsQueryForStats.CornersAgainst, GameDetailsPeriodsQueryForStats.FoulsFor, GameDetailsPeriodsQueryForStats.FoulsAgainst, GameDetailsPeriodsQueryForStats.OffsideFor, GameDetailsPeriodsQueryForStats.OffsideAgainst, GameDetailsPeriodsQueryForStats.Season, GameDetailsPeriodsQueryForStats.Location, GameDetailsPeriodsQueryForStats.GameType, GameDetailsPeriodsQueryForStats.TimeOfSeason, GameDetailsPeriodsQueryForStats.TimeOfSeason2, GameDetailsPeriodsQueryForStats.TimeOfSeason3, GameDetailsPeriodsQueryForStats.GoalsScored, GameDetailsPeriodsQueryForStats.GoalsConceded;
``

### Query: GameScheduleQueryForCSVExport
``sql
SELECT HighSchoolsTable.HighSchoolName AS Subject, LocationTable.Location, GameTypesTable.TimeOfSeason2 AS Category, Format([Date],"Short Date") AS [Start Date], Format([Time],"Medium Time") AS [Start Time], Format(DateAdd("h",2,[Time]),"Medium Time") AS [End Time]
FROM HighSchoolsTable INNER JOIN (GameTypesTable INNER JOIN (SeasonTable INNER JOIN (LocationTable INNER JOIN GamesTable ON LocationTable.LocationID = GamesTable.LocationIDGames) ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent
WHERE (((SeasonTable.SeasonID)=[Forms]![NavigationForm]![Season]))
ORDER BY GameTypesTable.TimeOfSeason2, Format([Date],"Short Date"), Format([Time],"Medium Time");
``

### Query: 'GameStatsFormVersion2_StartersQuery
``sql
SELECT [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#]
FROM ((PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN PlayerSeasonTable ON [Player-GameInfo].PlayerIDPlayerGameInfo = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames) AND ([Player-GameInfo].[GameIDPlayerGameInfo] = GamesTable.[GameID])
WHERE ((Not (PlayerTable.PlayerID)=[Forms]![GameStatsFormVersion2]![CurrentGK]))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#];
``

### Query: 'GameStatsFormVersion2GKStartUpdate
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].Start = True
WHERE ((([Player-GameInfo].PlayerIDPlayerGameInfo)=Forms!GameStatsFormVersion2!GameStatsFormVersion2_Starters.Form!GKStart) And (([Player-GameInfo].GameIDPlayerGameInfo)=Forms!GameStatsFormVersion2!Combo2));
``

### Query: 'GameStatsFormVersion2SubsEnterGameUpdate
``sql
UPDATE InGameStats SET InGameStats.[Minute] = [Forms]![gamestatsformversion2].[PeriodGameTimeSeconds], InGameStats.Period = [Forms]![gamestatsformversion2].[PeriodNoHolder]
WHERE (((InGameStats.Minute) Is Null));
``

### Query: GoalAgainstDetails
``sql
SELECT GoalsAgainst.*, Games_InGame_Event_Times.GameID, Games_InGame_Event_Times.Event, Games_InGame_Event_Times.TimeBegin, Games_InGame_Event_Times.TimeEnd, Games_InGame_Event_Times.PeriodEventTime, Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.StoppedTime, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.Date, GamesTable.Time, GamesTable.Opponent, GamesTable.Class, GamesTable.LocationIDGames, GamesTable.HomeGame, GamesTable.DistrictMatch
FROM ((Games_InGame_Event_Times INNER JOIN GamesTable ON Games_InGame_Event_Times.[GameID] = GamesTable.GameID) INNER JOIN SeasonTable ON GamesTable.SeasonIDGames = SeasonTable.SeasonID) INNER JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID;
``

### Query: GoalsAgainstDetailsByGame
``sql
SELECT GoalAgainstDetails.GameID, GoalAgainstDetails.SeasonID, Count(GoalAgainstDetails.[GoalsAgainst#]) AS GAg
FROM GoalAgainstDetails
GROUP BY GoalAgainstDetails.GameID, GoalAgainstDetails.SeasonID;
``

### Query: GoalScoredDetails
``sql
SELECT GoalsFor.*, Games_InGame_Event_Times.GameID, Games_InGame_Event_Times.Event, Games_InGame_Event_Times.TimeBegin, Games_InGame_Event_Times.TimeEnd, Games_InGame_Event_Times.PeriodEventTime, Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.StoppedTime, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.Opponent, GamesTable.LocationIDGames, GamesTable.Date, GamesTable.Time, GamesTable.Class
FROM ((Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) INNER JOIN GamesTable ON Games_InGame_Event_Times.[GameID] = GamesTable.GameID) INNER JOIN SeasonTable ON GamesTable.SeasonIDGames = SeasonTable.SeasonID;
``

### Query: GoalScoredDetailsByAssister
``sql
SELECT Games_InGame_Event_Times.GameID, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.Opponent, GamesTable.LocationIDGames, GamesTable.Date, GamesTable.Time, GamesTable.Class, Count(GoalsFor.[AssistedBy#]) AS [CountOfAssistedBy#], GoalsFor.[AssistedBy#]
FROM ((Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) INNER JOIN GamesTable ON Games_InGame_Event_Times.[GameID] = GamesTable.GameID) INNER JOIN SeasonTable ON GamesTable.SeasonIDGames = SeasonTable.SeasonID
GROUP BY Games_InGame_Event_Times.GameID, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.Opponent, GamesTable.LocationIDGames, GamesTable.Date, GamesTable.Time, GamesTable.Class, GoalsFor.[AssistedBy#]
ORDER BY Count(GoalsFor.[AssistedBy#]) DESC;
``

### Query: GoalScoredDetailsByGame
``sql
SELECT GoalScoredDetails.GameID, GoalScoredDetails.SeasonID, Count(GoalScoredDetails.[GoalsFor#]) AS GFor
FROM GoalScoredDetails
GROUP BY GoalScoredDetails.GameID, GoalScoredDetails.SeasonID;
``

### Query: GoalScoredDetailsByScorer
``sql
SELECT Games_InGame_Event_Times.GameID, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.Opponent, GamesTable.LocationIDGames, GamesTable.Date, GamesTable.Time, GamesTable.Class, Count(GoalsFor.[Scorer#]) AS [CountOfScorer#], GoalsFor.[Scorer#]
FROM ((Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) INNER JOIN GamesTable ON Games_InGame_Event_Times.[GameID] = GamesTable.GameID) INNER JOIN SeasonTable ON GamesTable.SeasonIDGames = SeasonTable.SeasonID
GROUP BY Games_InGame_Event_Times.GameID, SeasonTable.SeasonID, SeasonTable.Season, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.Opponent, GamesTable.LocationIDGames, GamesTable.Date, GamesTable.Time, GamesTable.Class, GoalsFor.[Scorer#]
ORDER BY Count(GoalsFor.[Scorer#]) DESC;
``

### Query: InGameStatsGameMinuteQuery
``sql
SELECT InGameStats.GameIDInGame, InGameStats.PlayerNoOut, InGameStats.PlayerNoIn, InGameStats.Period, InGameStats.Minute, GameDetailsQuery.TotalGameTime AS Gametime, [GameTime]-([Minute]+Nz(1*DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[gameid]=" & [GameIDingame] & " and [period]<" & [Period]))) AS TimeDiff
FROM GameDetailsQuery INNER JOIN InGameStats ON GameDetailsQuery.GameID = InGameStats.[GameIDInGame];
``

### Query: 'InGameStatsGameMinuteUPDATEGameQuery
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].OutMinutes = Nz(DSum("[TimeDiff]","[InGameStatsGameMinuteQuery]","[GameIDInGame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [PlayerIDPlayerGameInfo]),0), [Player-GameInfo].InMinutes = Nz(DSum("[TimeDiff]","[InGameStatsGameMinuteQuery]","[GameIDInGame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [PlayerIDPlayerGameInfo]),0), [Player-GameInfo].StartMinutes = -[Start]*Nz(DLookUp("[SumOfPeriodLength]","[GameDetailsQueryForStats]","[GameID]=" & [GameIDPlayerGameInfo]),0)
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsForm]![Combo2]));
``

### Query: 'InGameStatsGameMinuteUPDATEQuery
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].OutMinutes = Nz(DSum("[TimeDiff]","[InGameStatsGameMinuteQuery]","[GameIDInGame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [PlayerIDPlayerGameInfo]),0), [Player-GameInfo].InMinutes = Nz(DSum("[TimeDiff]","[InGameStatsGameMinuteQuery]","[GameIDInGame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [PlayerIDPlayerGameInfo]),0), [Player-GameInfo].StartMinutes = -[Start]*Nz(DLookUp("[SumOfPeriodLength]","[GameDetailsQueryForStats]","[GameID]=" & [GameIDPlayerGameInfo]),0);
``

### Query: PlayerEligibleYearsDomain
``sql
SELECT PlayerYearsJoin.Season, PlayerYearsJoin.SeasonID, PlayerYearsJoin.PlayerID
FROM PlayerTable INNER JOIN PlayerYearsJoin ON PlayerTable.PlayerID = PlayerYearsJoin.PlayerID
WHERE (((PlayerYearsJoin.Season)<=[FinalYear] And (PlayerYearsJoin.Season)>=[PlayerYearEntered9th]));
``

### Query: PlayerGameDetailsPeriodsQuery
``sql
SELECT GameDetailsPeriodsQuery.GameID, GameDetailsPeriodsQuery.Date, GameDetailsPeriodsQuery.Time, GameDetailsPeriodsQuery.Opponent, GameDetailsPeriodsQuery.Season, [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, GameDetailsPeriodsQuery.Period, GameDetailsPeriodsQuery.PeriodLength
FROM (PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN GameDetailsPeriodsQuery ON [Player-GameInfo].[GameIDPlayerGameInfo] = GameDetailsPeriodsQuery.[GameID]
WHERE (((GameDetailsPeriodsQuery.GameType)<>"scrimmage" And (GameDetailsPeriodsQuery.GameType)<>"Play Day" And (GameDetailsPeriodsQuery.GameType)<>"JV" And (GameDetailsPeriodsQuery.GameType)<>"JV Scrimmage"));
``

### Query: PlayerGameDetailsPeriodsQueryForStats
``sql
SELECT GameDetailsPeriodsQueryForStats.GameID, GameDetailsPeriodsQueryForStats.Date, GameDetailsPeriodsQueryForStats.Time, GameDetailsPeriodsQueryForStats.Opponent, GameDetailsPeriodsQueryForStats.Season, [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, GameDetailsPeriodsQueryForStats.Period, GameDetailsPeriodsQueryForStats.PeriodLength
FROM (PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN GameDetailsPeriodsQueryForStats ON [Player-GameInfo].[GameIDPlayerGameInfo] = GameDetailsPeriodsQueryForStats.[GameID]
WHERE (((GameDetailsPeriodsQueryForStats.GameType)<>"scrimmage" And (GameDetailsPeriodsQueryForStats.GameType)<>"Play Day" And (GameDetailsPeriodsQueryForStats.GameType)<>"JV" And (GameDetailsPeriodsQueryForStats.GameType)<>"JV Scrimmage"));
``

### Query: PlayerGameDetailsQuery
``sql
SELECT GameDetailsQuery.GameID, GameDetailsQuery.Date, GameDetailsQuery.Time, GameDetailsQuery.Opponent, GameDetailsQuery.Season, PlayerTable.PlayerID, PlayerTable.PlayerFullName, GameDetailsQuery.SeasonIDGames, GameDetailsQuery.TotalGameTime, IIf([MinPlayedGame]>0,1,0) AS GP, Int([MinPlayedGame]/60) AS GameMinutes, GameDetailsQuery.HomeGame, GameDetailsQuery.DistrictMatch, GameDetailsQuery.CurrentGK, [Player-GameInfo].*
FROM PlayerTable INNER JOIN (GameDetailsQuery INNER JOIN [Player-GameInfo] ON GameDetailsQuery.GameID = [Player-GameInfo].[GameIDPlayerGameInfo]) ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]
WHERE (((GameDetailsQuery.GameType)<>"scrimmage" And (GameDetailsQuery.GameType)<>"Play Day" And (GameDetailsQuery.GameType)<>"JV" And (GameDetailsQuery.GameType)<>"JV Scrimmage"))
ORDER BY GameDetailsQuery.GameID DESC;
``

### Query: PlayerGameDetailsQuery_Crosstab
``sql
TRANSFORM Sum(PlayerGameDetailsQuery.GameMinutes) AS SumOfGameMinutes
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Season, Sum(PlayerGameDetailsQuery.GameMinutes) AS SumOfGameMinutes1
FROM PlayerGameDetailsQuery
WHERE (((PlayerGameDetailsQuery.Season)=2016))
GROUP BY PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Season
PIVOT PlayerGameDetailsQuery.Date;
``

### Query: PlayerGameDetailsQueryForStats
``sql
SELECT [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, [Player-GameInfo].MinPlayedGame, IIf([MinPlayedGame]>0,1,0) AS GP, GameDetailsQuery.Opponent, GameDetailsQuery.Date, GameDetailsQuery.SeasonIDGames, GameDetailsQuery.Time, GameDetailsQuery.Season, 1*DCount("[scorer#]","[GoalScoredDetails]","[Gameid] =" & [GameIDPlayerGameInfo] & " and  [Scorer#]=" & [PlayerID]) AS GF, 1*DCount("[scorer#]","[GoalScoredDetails]","[Gameid] =" & [GameIDPlayerGameInfo] & " and  [AssistedBy#]=" & [PlayerID]) AS A, 1*DCount("[ScoredOnPlayer#]","[GoalAgainstDetails]","[gameid]=" & [GameIDPlayerGameInfo] & " and  [ScoredOnPlayer#] =" & [PlayerID]) AS GA, 1*-DSum("[GameWinner]","[GoalScoredDetails]","[gameid]=" & [GameIDPlayerGameInfo] & " and  [Scorer#] =" & [PlayerID]) AS GWG, 1*-DSum("[GameWinner]","[GoalScoredDetails]","[gameid]=" & [GameIDPlayerGameInfo] & " and  [assistedby#] =" & [PlayerID]) AS GWA, [Player-GameInfo].Plus, [Player-GameInfo].Minus, Nz([Plus])-Nz([Minus]) AS [Plus/Minus], Int([MinPlayedGame]/60) AS GameMinutes, GameDetailsQuery.DistrictMatch, GameDetailsQuery.HomeGame
FROM (PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN GameDetailsQuery ON [Player-GameInfo].[GameIDPlayerGameInfo] = GameDetailsQuery.GameID
ORDER BY [Player-GameInfo].GameIDPlayerGameInfo DESC;
``

### Query: PlayerGameDetailsQueryGAssists
``sql
SELECT Games_InGame_Event_Times.GameID, GoalsFor.[AssistedBy#], Sum(GoalsFor.GameWinner) AS SumOfGameWinner, Count(Nz([GoalsFor#],0)) AS A
FROM Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID
GROUP BY Games_InGame_Event_Times.GameID, GoalsFor.[AssistedBy#];
``

### Query: PlayerGameDetailsQueryGScored
``sql
SELECT Games_InGame_Event_Times.GameID, GoalsFor.[Scorer#], Sum(GoalsFor.GameWinner) AS SumOfGameWinner, Count(GoalsFor.[GoalsFor#]) AS GF
FROM Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID
GROUP BY Games_InGame_Event_Times.GameID, GoalsFor.[Scorer#];
``

### Query: PlayerGameDetailsQueryPlusMinus_Crosstab
``sql
TRANSFORM Sum(PlayerGameDetailsQueryForStats.[Plus/Minus]) AS [SumOfPlus/Minus1]
SELECT PlayerGameDetailsQueryForStats.PlayerFullName, PlayerGameDetailsQueryForStats.Season, Sum(PlayerGameDetailsQueryForStats.[Plus/Minus]) AS [SumOfPlus/Minus]
FROM PlayerGameDetailsQueryForStats
WHERE (((PlayerGameDetailsQueryForStats.Season)=2016))
GROUP BY PlayerGameDetailsQueryForStats.PlayerFullName, PlayerGameDetailsQueryForStats.Season
PIVOT PlayerGameDetailsQueryForStats.Date;
``

### Query: PlayerGamesUnion_ForUpdateQuery
``sql
SELECT PlayerSeasonTable.[Player#] AS PlayerNo, GameDetailsQuery.GameID, PlayerSeasonTable.SeasonID, PlayerSeasonTable.ParticipatingThisYear
FROM PlayerSeasonTable INNER JOIN GameDetailsQuery ON PlayerSeasonTable.SeasonID = GameDetailsQuery.SeasonIDGames
WHERE (((GameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.ParticipatingThisYear)=Yes));
``

### Query: PlayerGamesUnion_ForUpdateQueryHorizontal
``sql
SELECT PlayerSeasonTable.[Player#] AS PlayerNo, GameDetailsQuery.GameID, PlayerSeasonTable.SeasonID, PlayerSeasonTable.ParticipatingThisYear
FROM PlayerSeasonTable INNER JOIN GameDetailsQuery ON PlayerSeasonTable.SeasonID = GameDetailsQuery.SeasonIDGames
WHERE (((GameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.ParticipatingThisYear)=Yes));
``

### Query: PlayerGameTotalPoints
``sql
SELECT [Player-GameInfo].PlayerIDPlayerGameInfo, [Player-GameInfo].GameIDPlayerGameInfo, GoalScoredDetailsByScorer.[CountOfScorer#], GoalScoredDetailsByAssister.[CountOfAssistedBy#]
FROM ([Player-GameInfo] LEFT JOIN GoalScoredDetailsByAssister ON ([Player-GameInfo].GameIDPlayerGameInfo = GoalScoredDetailsByAssister.GameID) AND ([Player-GameInfo].PlayerIDPlayerGameInfo = GoalScoredDetailsByAssister.[AssistedBy#])) LEFT JOIN GoalScoredDetailsByScorer ON ([Player-GameInfo].GameIDPlayerGameInfo = GoalScoredDetailsByScorer.GameID) AND ([Player-GameInfo].PlayerIDPlayerGameInfo = GoalScoredDetailsByScorer.[Scorer#]);
``

### Query: PlayerSeasonsPlayed
``sql
SELECT PlayerSeasonTable.ParticipatingThisYear, PlayerTable.PlayerFullName, PlayerTable.PlayerID, Min(SeasonTable.Season) AS 1stSeason, Max(SeasonTable.Season) AS LastSeason, PlayerTable.PlayerYearEntered9th, [PlayerYearEntered9th]+3 AS SeniorYear, Sum(PlayerSeasonTable.Varsity) AS SumOfVarsity
FROM (PlayerSeasonTable INNER JOIN PlayerTable ON PlayerSeasonTable.[Player#] = PlayerTable.PlayerID) INNER JOIN SeasonTable ON PlayerSeasonTable.SeasonID = SeasonTable.SeasonID
GROUP BY PlayerSeasonTable.ParticipatingThisYear, PlayerTable.PlayerFullName, PlayerTable.PlayerID, PlayerTable.PlayerYearEntered9th, [PlayerYearEntered9th]+3
HAVING (((PlayerSeasonTable.ParticipatingThisYear)=Yes));
``

### Query: PlayerYearsJoin
``sql
SELECT PlayerTable.PlayerID, SeasonTable.SeasonID, SeasonTable.Season, SeasonTable.SchoolYear
FROM SeasonTable, PlayerTable;
``

### Query: 'PlusMinusUpdateGAMEQuery
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].Plus = 1*DSum("[PlayerPlus]","[STATSPlusPerGame]","[PlayerIDPlayerGameInfo] =" & [Player-GameInfo]![PlayerIDPlayerGameInfo] & " and  [GameIDPlayerGameInfo] =" & [Player-GameInfo]![GameIDPlayerGameInfo]), [Player-GameInfo].Minus = 1*DSum("[PlayerMinus]","[STATSMinusPerGame]","[PlayerIDPlayerGameInfo] =" & [Player-GameInfo]![PlayerIDPlayerGameInfo] & " and  [GameIDPlayerGameInfo] =" & [Player-GameInfo]![GameIDPlayerGameInfo])
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()));
``

### Query: 'PlusMinusUpdateQuery
``sql
UPDATE GamesTable INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo SET [Player-GameInfo].Plus = 1*DSum("[PlayerPlus]","[STATSPlusPerGame]","[PlayerIDPlayerGameInfo] =" & [Player-GameInfo]![PlayerIDPlayerGameInfo] & " and  [GameIDPlayerGameInfo] =" & [Player-GameInfo]![GameIDPlayerGameInfo]), [Player-GameInfo].Minus = 1*DSum("[PlayerMinus]","[STATSMinusPerGame]","[PlayerIDPlayerGameInfo] =" & [Player-GameInfo]![PlayerIDPlayerGameInfo] & " and  [GameIDPlayerGameInfo] =" & [Player-GameInfo]![GameIDPlayerGameInfo])
WHERE (((GamesTable.SeasonIDGames)=strSeasonIDpub()));
``

### Query: qryGoalsScoredIndividual
``sql
SELECT Games_InGame_Event_Times.EventTime, GoalsFor.[Scorer#], GoalsFor.[AssistedBy#], DLookUp("PlayerFullName","PlayerTable","PlayerID=" & [Scorer#]) AS GoalBy, DLookUp("PlayerFullName","PlayerTable","PlayerID=" & [AssistedBy#]) AS AssistedBy, GamesTable.*
FROM PlayerTable INNER JOIN ((GamesTable INNER JOIN Games_InGame_Event_Times ON GamesTable.GameID = Games_InGame_Event_Times.GameID) INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON PlayerTable.PlayerID = GoalsFor.[AssistedBy#];
``

### Query: qryUpdateGameMinuteForSubs
``sql
UPDATE InGameStats SET InGameStats.GameMinute = Nz(DSum("TotalPeriodTime","GamesInfoTimes","[GameGameInfoTimesID]=" & strGameIDpub() & " and [Period]<" & [Forms]![GameStatsFormVersion2Horizontal]![GamePeriod]),0)+[minute]
WHERE (((InGameStats.GameIDInGame)=strGameIDpub()) And ((InGameStats.Period)=Forms!GameStatsFormVersion2Horizontal!GamePeriod));
``

### Query: qryUpdateMinPlayed
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].InMinutes = Nz([inminutes],0)+[Forms]![GameStatsFormVersion2Horizontal]![PeriodGameTimeSeconds]-Nz(DMax("Minute","InGameStats","[GameIDInGame]=" & strGameIDpub() & " and [Period]=" & [Forms]![GameStatsFormVersion2Horizontal]![PeriodNoHolder] & " and [PlayerNoIn]=" & [PlayerIDPlayerGameInfo]),0)
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) AND ((Nz(DCount("PlayerNoIn","InGameStats","[gameidingame]=" & [Forms]![GameStatsFormVersion2Horizontal]![Combo2] & " and [playernoin]=" & [playeridplayergameinfo]),0)-[start]-Nz(DCount("PlayerNoOut","InGameStats","[gameidingame]=" & [Forms]![GameStatsFormVersion2Horizontal]![Combo2] & " and [playernoout]=" & [playeridplayergameinfo]),0))<>0));
``

### Query: qryUpdateMinPlayedFORGAME
``sql
SELECT [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].PlayerIDPlayerGameInfo, GamesInfoTimes.TotalPeriodTime, InGameStats.GameMinute
FROM [Player-GameInfo] INNER JOIN (InGameStats INNER JOIN GamesInfoTimes ON (InGameStats.Period = GamesInfoTimes.Period) AND (InGameStats.GameIDInGame = GamesInfoTimes.GameGameInfoTimesID)) ON ([Player-GameInfo].PlayerIDPlayerGameInfo = InGameStats.PlayerNoOut) AND ([Player-GameInfo].GameIDPlayerGameInfo = GamesInfoTimes.GameGameInfoTimesID);
``

### Query: qryUpdateMinPlayedFORSEASON
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].InMinutes = Nz([inminutes],0)+[Forms]![GameStatsFormVersion2Horizontal]![PeriodGameTimeSeconds]-Nz(DMax("Minute","InGameStats","[GameIDInGame]=" & [Forms]![GameStatsFormVersion2Horizontal]![Combo2] & " and [Period]=" & [Forms]![GameStatsFormVersion2Horizontal]![PeriodNoHolder] & " and [PlayerNoIn]=" & [PlayerIDPlayerGameInfo]),0)
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=Forms!GameStatsFormVersion2Horizontal!Combo2) And ((nz(DCount("PlayerNoIn","InGameStats","[gameidingame]=" & Forms!GameStatsFormVersion2Horizontal!Combo2 & " and [playernoin]=" & [playeridplayergameinfo]),0)-[start]-nz(DCount("PlayerNoOut","InGameStats","[gameidingame]=" & Forms!GameStatsFormVersion2Horizontal!Combo2 & " and [playernoout]=" & [playeridplayergameinfo]),0))<>0));
``

### Query: qryUpdateMinPlayedSubOutAll
``sql
UPDATE [Player-GameInfo] INNER JOIN InGameStats ON ([Player-GameInfo].PlayerIDPlayerGameInfo = InGameStats.PlayerNoOut) AND ([Player-GameInfo].GameIDPlayerGameInfo = InGameStats.GameIDInGame) SET [Player-GameInfo].InMinutes = Nz([inminutes],0)+[Forms]![GameStatsFormVersion2Horizontal]![PeriodGameTimeSeconds]-Nz(DMax("Minute","InGameStats","[GameIDInGame]=" & strGameIDpub() & " and [Period]=" & [Forms]![GameStatsFormVersion2Horizontal]![PeriodNoHolder] & " and [PlayerNoIn]=" & [PlayerIDPlayerGameInfo]),0)
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) AND ((InGameStats.Minute) Is Null));
``

### Query: qryUpdateMinPlayedSubOutSingle
``sql
UPDATE [Player-GameInfo] INNER JOIN InGameStats ON ([Player-GameInfo].GameIDPlayerGameInfo = InGameStats.GameIDInGame) AND ([Player-GameInfo].PlayerIDPlayerGameInfo = InGameStats.PlayerNoOut) SET [Player-GameInfo].InMinutes = Nz([inminutes],0)+[Forms]![GameStatsFormVersion2Horizontal]![PeriodGameTimeSeconds]-Nz(DMax("Minute","InGameStats","[GameIDInGame]=" & strGameIDpub() & " and [Period]=" & [Forms]![GameStatsFormVersion2Horizontal]![PeriodNoHolder] & " and [PlayerNoIn]=" & [PlayerIDPlayerGameInfo]),0)
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) And (([Player-GameInfo].PlayerIDPlayerGameInfo)=Forms!GameStatsFormVersion2Horizontal!playernoout));
``

### Query: Query1
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].Plus = Nz([plus],0)+1
WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playeridplayergameinfo] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playeridplayergameinfo] & " and [minute] is not null"))<>0) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()));
``

### Query: Query2
``sql
UPDATE [Player-GameInfo] SET [Player-GameInfo].Minus = Nz([minus],0)+1
WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playeridplayergameinfo] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playeridplayergameinfo] & " and [minute] is not null"))<>0) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()));
``

### Query: Results_CrosstabOPPONENT
``sql
TRANSFORM Nz(Count([ResultsGame].Gameid))+0 AS CountOfGameid
SELECT ResultsGame.Opponent, Count(ResultsGame.GameID) AS CountOfGameID1, Sum(ResultsGame.GF) AS SumOfGF, Sum(ResultsGame.GA) AS SumOfGA, Sum(ResultsGame.SO) AS SumOfSO
FROM ResultsGame
WHERE (((ResultsGame.Date)<Now()))
GROUP BY ResultsGame.Opponent
PIVOT ResultsGame.Result In ("W","L","T");
``

### Query: Results_CrosstabSeason
``sql
TRANSFORM Nz(Count([ResultsGame].Gameid))+0 AS CountOfGameid
SELECT ResultsGame.SeasonIDGames, Count(ResultsGame.GameID) AS CountOfGameID1, Sum(ResultsGame.GF) AS SumOfGF, Sum(ResultsGame.GA) AS SumOfGA, Sum(ResultsGame.SO) AS SumOfSO
FROM ResultsGame
WHERE (((ResultsGame.Date)<Now()))
GROUP BY ResultsGame.SeasonIDGames
PIVOT ResultsGame.Result In ("W","L","T");
``

### Query: Results_CrosstabSeasonDISTRICT
``sql
TRANSFORM Nz(Count([ResultsGame].Gameid))+0 AS CountOfGameid
SELECT ResultsGame.SeasonIDGames, Count(ResultsGame.GameID) AS CountOfGameID1, Sum(ResultsGame.GF) AS SumOfGF, Sum(ResultsGame.GA) AS SumOfGA, Sum(ResultsGame.SO) AS SumOfSO
FROM ResultsGame
WHERE (((ResultsGame.Date)<Now()) AND ((ResultsGame.DistrictMatch)=True))
GROUP BY ResultsGame.SeasonIDGames, ResultsGame.TimeOfSeason3
PIVOT ResultsGame.Result In ("W","L","T");
``

### Query: Results_CrosstabSeasonHOME
``sql
TRANSFORM Nz(Count([ResultsGame].Gameid))+0 AS CountOfGameid
SELECT ResultsGame.SeasonIDGames, Count(ResultsGame.GameID) AS CountOfGameID1, Sum(ResultsGame.GF) AS SumOfGF, Sum(ResultsGame.GA) AS SumOfGA, Sum(ResultsGame.SO) AS SumOfSO
FROM ResultsGame
WHERE (((ResultsGame.Date)<Now()) AND ((ResultsGame.HomeGame)=True))
GROUP BY ResultsGame.SeasonIDGames, ResultsGame.TimeOfSeason3
PIVOT ResultsGame.Result In ("W","L","T");
``

### Query: Results_CrosstabSeasonPOST
``sql
TRANSFORM Nz(Count([ResultsGame].Gameid))+0 AS CountOfGameid
SELECT ResultsGame.SeasonIDGames, Count(ResultsGame.GameID) AS CountOfGameID1, Sum(ResultsGame.GF) AS SumOfGF, Sum(ResultsGame.GA) AS SumOfGA, Sum(ResultsGame.SO) AS SumOfSO
FROM ResultsGame
WHERE (((ResultsGame.Date)<Now()) AND ((ResultsGame.TimeOfSeason3)=3))
GROUP BY ResultsGame.SeasonIDGames, ResultsGame.TimeOfSeason3
PIVOT ResultsGame.Result In ("W","L","T");
``

### Query: ResultsGame
``sql
SELECT GameDetailsQuery.GameID, GameDetailsQuery.SeasonIDGames, GameDetailsQuery.Date, GameDetailsQuery.Time, GameDetailsQuery.DepartureTime, GameDetailsQuery.Opponent, GameDetailsQuery.Class, GameDetailsQuery.LocationIDGames, GameDetailsQuery.HomeGame, GameDetailsQuery.DistrictMatch, GameDetailsQuery.GameTypeIDGames, GameDetailsQuery.Comment, 1*Nz([GAg],0) AS GA, 1*Nz([gfor],0) AS GF, IIf(Nz([GFor],0)>Nz([GAg],0),"W",IIf(Nz([GFor],0)=Nz([GAg],0),"T","L")) AS Result, GameDetailsQuery.TimeOfSeason3, IIf(Nz([GAg],0)=0,1,0) AS SO
FROM (GameDetailsQuery LEFT JOIN GoalScoredDetailsByGame ON GameDetailsQuery.GameID = GoalScoredDetailsByGame.GameID) LEFT JOIN GoalsAgainstDetailsByGame ON GameDetailsQuery.GameID = GoalsAgainstDetailsByGame.GameID
GROUP BY GameDetailsQuery.GameID, GameDetailsQuery.SeasonIDGames, GameDetailsQuery.Date, GameDetailsQuery.Time, GameDetailsQuery.DepartureTime, GameDetailsQuery.Opponent, GameDetailsQuery.Class, GameDetailsQuery.LocationIDGames, GameDetailsQuery.HomeGame, GameDetailsQuery.DistrictMatch, GameDetailsQuery.GameTypeIDGames, GameDetailsQuery.Comment, IIf(Nz([GFor],0)>Nz([GAg],0),"W",IIf(Nz([GFor],0)=Nz([GAg],0),"T","L")), GameDetailsQuery.TimeOfSeason3, Nz([GAg],0), Nz([gfor],0), IIf(Nz([GAg],0)=0,1,0)
HAVING (((GameDetailsQuery.SeasonIDGames)>2) AND ((GameDetailsQuery.TimeOfSeason3)=2)) OR (((GameDetailsQuery.SeasonIDGames)>2) AND ((GameDetailsQuery.TimeOfSeason3)=3));

UNION SELECT GamesTable.GameID, GamesTable.SeasonIDGames, GamesTable.Date, GamesTable.Time, GamesTable.DepartureTime, GamesTable.Opponent, GamesTable.Class, GamesTable.LocationIDGames, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.GameTypeIDGames, GamesTable.Comment, PastStatsGameScores.OpponentScore, PastStatsGameScores.IndyScore, IIf([IndyScore]>[OpponentScore],"W",IIf([IndyScore]=[OpponentScore],"T","L")) AS Result,GameTypesTable.TimeOfSeason3,IIf(Nz([OpponentScore],0)=0,1,0) AS SO
FROM GameTypesTable INNER JOIN (GamesTable INNER JOIN PastStatsGameScores ON GamesTable.GameID = PastStatsGameScores.[Game#]) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames
GROUP BY GamesTable.GameID, GamesTable.SeasonIDGames, GamesTable.Date, GamesTable.Time, GamesTable.DepartureTime, GamesTable.Opponent, GamesTable.Class, GamesTable.LocationIDGames, GamesTable.HomeGame, GamesTable.DistrictMatch, GamesTable.GameTypeIDGames, GamesTable.Comment, PastStatsGameScores.OpponentScore, PastStatsGameScores.IndyScore, IIf([IndyScore]>[OpponentScore],"W",IIf([IndyScore]=[OpponentScore],"T","L")), GameTypesTable.TimeOfSeason3
HAVING (((GameTypesTable.TimeOfSeason3)=2 Or (GameTypesTable.TimeOfSeason3)=3));
``

### Query: STATSAllAssistersQuery
``sql
SELECT PastSeasonStats.[PlayerID#], PastSeasonStats.SeasonID, PastSeasonStats.Assists,0 as GWA
FROM PastSeasonStats
UNION SELECT PlayerTable.PlayerID, GoalScoredDetails.SeasonID, Count(GoalScoredDetails.[Scorer#]) AS [CountOfScorer#], Sum(GoalScoredDetails.GameWinner) AS SumOfGameWinner
FROM PlayerTable LEFT JOIN GoalScoredDetails ON PlayerTable.PlayerID = GoalScoredDetails.[AssistedBy#]
GROUP BY PlayerTable.PlayerID, GoalScoredDetails.SeasonID;
``

### Query: STATSAllGKQuery
``sql
SELECT PastSeasonStats.[PlayerID#], PastSeasonStats.SeasonID, PastSeasonStats.[GoalsAgainst]
FROM PastSeasonStats;
UNION SELECT GoalAgainstDetails.[ScoredOnPlayer#], GoalAgainstDetails.SeasonID, Count(GoalAgainstDetails.[ScoredOnPlayer#]) AS GK
FROM GoalAgainstDetails
GROUP BY GoalAgainstDetails.[ScoredOnPlayer#], GoalAgainstDetails.SeasonID;
``

### Query: STATSAllGoalScorersQuery
``sql
SELECT PastSeasonStats.[PlayerID#], PastSeasonStats.SeasonID, PastSeasonStats.Goals,0 AS GWG
FROM PastSeasonStats
UNION SELECT PlayerTable.PlayerID, GoalScoredDetails.SeasonID, Count(GoalScoredDetails.[Scorer#]) AS [CountOfScorer#], Sum(GoalScoredDetails.GameWinner) AS SumOfGameWinner
FROM PlayerTable LEFT JOIN GoalScoredDetails ON PlayerTable.PlayerID = GoalScoredDetails.[Scorer#]
GROUP BY PlayerTable.PlayerID, GoalScoredDetails.SeasonID;
``

### Query: STATSGKSaves
``sql
SELECT [Player-GameInfo].PlayerIDPlayerGameInfo, Sum([Player-GameInfo].Saves) AS SumOfSaves, SeasonTable.Season, Sum([Player-GameInfo].MinInGoal) AS SumOfMinInGoal
FROM (SeasonTable INNER JOIN GamesTable ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo
GROUP BY [Player-GameInfo].PlayerIDPlayerGameInfo, SeasonTable.Season
HAVING (((Sum([Player-GameInfo].MinInGoal))>0));
``

### Query: STATSGKTotals
``sql
SELECT PlayerSeasonTable.[Player#], PlayerSeasonTable.SeasonID, STATSSeasonTotals.GKMin, STATSSeasonTotals.SumOfSaves, STATSAllGKQuery.GoalsAgainst
FROM (PlayerSeasonTable LEFT JOIN STATSSeasonTotals ON (PlayerSeasonTable.SeasonID = STATSSeasonTotals.SeasonIDGames) AND (PlayerSeasonTable.[Player#] = STATSSeasonTotals.PlayerID)) LEFT JOIN STATSAllGKQuery ON (PlayerSeasonTable.[Player#] = STATSAllGKQuery.[PlayerID#]) AND (PlayerSeasonTable.SeasonID = STATSAllGKQuery.SeasonID)
GROUP BY PlayerSeasonTable.[Player#], PlayerSeasonTable.SeasonID, STATSSeasonTotals.GKMin, STATSSeasonTotals.SumOfSaves, STATSAllGKQuery.GoalsAgainst;
``

### Query: STATSMinusPerGame
``sql
SELECT [Player-GameInfo].PlayerIDPlayerGameInfo, [Player-GameInfo].GameIDPlayerGameInfo, DCount("[playernoin]","[statsplusminuspergamegameminutesubs]","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [PlayerIDPlayerGameInfo] & " and [gameminute]<" & [gameminute])-[start]-DCount("[playernoout]","[statsplusminuspergamegameminutesubs]","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [PlayerIDPlayerGameInfo] & " and  [gameminute]<" & [gameminute]) AS PlayerMinus, Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.PeriodEventTime, Games_InGame_Event_Times.Event, DLookUp("[GameMinute]","[STATSPlusMinusPerGameGameMinuteEvents]","[gameeventid]=" & [gameeventid]) AS GameMinute
FROM [Player-GameInfo] INNER JOIN Games_InGame_Event_Times ON [Player-GameInfo].GameIDPlayerGameInfo = Games_InGame_Event_Times.GameID
WHERE (((Games_InGame_Event_Times.Event)=2));
``

### Query: STATSOffensiveTotals
``sql
SELECT PlayerSeasonTable.[Player#], PlayerSeasonTable.SeasonID, PlayerSeasonTable.Grade, STATSAllGoalScorersQuery.Goals, STATSAllAssistersQuery.Assists, Nz([Goals])*2+Nz([Assists]) AS Points, STATSSeasonTotals.SumOfGP, STATSAllGoalScorersQuery.GWG, STATSAllAssistersQuery.GWA
FROM ((PlayerSeasonTable LEFT JOIN STATSAllGoalScorersQuery ON (PlayerSeasonTable.SeasonID = STATSAllGoalScorersQuery.SeasonID) AND (PlayerSeasonTable.[Player#] = STATSAllGoalScorersQuery.[PlayerID#])) LEFT JOIN STATSAllAssistersQuery ON (PlayerSeasonTable.SeasonID = STATSAllAssistersQuery.SeasonID) AND (PlayerSeasonTable.[Player#] = STATSAllAssistersQuery.[PlayerID#])) LEFT JOIN STATSSeasonTotals ON (PlayerSeasonTable.[Player#] = STATSSeasonTotals.PlayerID) AND (PlayerSeasonTable.SeasonID = STATSSeasonTotals.SeasonIDGames)
GROUP BY PlayerSeasonTable.[Player#], PlayerSeasonTable.SeasonID, PlayerSeasonTable.Grade, STATSAllGoalScorersQuery.Goals, STATSAllAssistersQuery.Assists, Nz([Goals])*2+Nz([Assists]), STATSSeasonTotals.SumOfGP, STATSAllGoalScorersQuery.GWG, STATSAllAssistersQuery.GWA;
``

### Query: STATSPlayerCareerTotals
``sql
SELECT STATSPlayerSeasonTotals.PlayerFullName, Sum(STATSPlayerSeasonTotals.Starts) AS SumOfStarts, Sum(STATSPlayerSeasonTotals.GP) AS SumOfGP, Sum(STATSPlayerSeasonTotals.PlusMinus) AS [SumOf+/-], Sum(STATSPlayerSeasonTotals.Plus) AS [SumOf+], Sum(STATSPlayerSeasonTotals.Minus) AS [SumOf-], Sum(STATSPlayerSeasonTotals.Minutes) AS SumOfMinutes, Sum(STATSPlayerSeasonTotals.G) AS SumOfG, Sum(STATSPlayerSeasonTotals.A) AS SumOfA, Sum(STATSPlayerSeasonTotals.Points) AS SumOfPoints, Sum(STATSPlayerSeasonTotals.SumOfSaves) AS SumOfSumOfSaves, Sum(STATSPlayerSeasonTotals.GoalsAgainst) AS SumOfGoalsAgainst, Sum(STATSPlayerSeasonTotals.GKMin) AS SumOfSumOfMinInGoal, Sum(STATSPlayerSeasonTotals.GWGoal) AS SumOfGWGoal, Sum(STATSPlayerSeasonTotals.GWAssist) AS SumOfGWAssist, STATSPlayerSeasonTotals.PlayerLastName, STATSPlayerSeasonTotals.PlayerFirstName
FROM STATSPlayerSeasonTotals
GROUP BY STATSPlayerSeasonTotals.PlayerFullName, STATSPlayerSeasonTotals.PlayerLastName, STATSPlayerSeasonTotals.PlayerFirstName
ORDER BY STATSPlayerSeasonTotals.PlayerLastName, STATSPlayerSeasonTotals.PlayerFirstName;
``

### Query: STATSPlayerGameTotals
``sql
SELECT [Player-GameInfo].PlayerIDPlayerGameInfo, DLookUp("[countofscorer#]","STATSPlayerGameTotalsGoals","[scorer#]=" & [playeridplayergameinfo] & " and [gameid]=" & [gameidplayergameinfo]) AS G, [Player-GameInfo].GameIDPlayerGameInfo, DLookUp("[countofassistedby#]","STATSPlayerGameTotalsassists","[assistedby#]=" & [playeridplayergameinfo] & " and [gameid]=" & [gameidplayergameinfo]) AS A
FROM [Player-GameInfo]
GROUP BY [Player-GameInfo].PlayerIDPlayerGameInfo, DLookUp("[countofscorer#]","STATSPlayerGameTotalsGoals","[scorer#]=" & [playeridplayergameinfo] & " and [gameid]=" & [gameidplayergameinfo]), [Player-GameInfo].GameIDPlayerGameInfo, DLookUp("[countofassistedby#]","STATSPlayerGameTotalsassists","[assistedby#]=" & [playeridplayergameinfo] & " and [gameid]=" & [gameidplayergameinfo]);
``

### Query: STATSPlayerGameTotalsAssists
``sql
SELECT GoalScoredDetails.[AssistedBy#], Count(GoalScoredDetails.[AssistedBy#]) AS [CountOfAssistedBy#], GoalScoredDetails.GameID, GoalScoredDetails.Date, GoalScoredDetails.Time, PlayerTable.PlayerFullName, GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade, GameDetailsQuery.DistrictMatch, GameDetailsQuery.HomeGame, GameDetailsQuery.Location, GameDetailsQuery.HighSchoolName
FROM (GoalScoredDetails INNER JOIN (PlayerSeasonTable INNER JOIN GameDetailsQuery ON PlayerSeasonTable.SeasonID = GameDetailsQuery.SeasonIDGames) ON (GoalScoredDetails.[AssistedBy#] = PlayerSeasonTable.[Player#]) AND (GoalScoredDetails.GameID = GameDetailsQuery.GameID)) INNER JOIN PlayerTable ON GoalScoredDetails.[AssistedBy#] = PlayerTable.PlayerID
GROUP BY GoalScoredDetails.[AssistedBy#], GoalScoredDetails.GameID, GoalScoredDetails.Date, GoalScoredDetails.Time, PlayerTable.PlayerFullName, GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade, GameDetailsQuery.DistrictMatch, GameDetailsQuery.HomeGame, GameDetailsQuery.Location, GameDetailsQuery.HighSchoolName
ORDER BY Count(GoalScoredDetails.[AssistedBy#]) DESC , GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade DESC;
``

### Query: STATSPlayerGameTotalsGoals
``sql
SELECT GoalScoredDetails.[Scorer#], Count(GoalScoredDetails.[Scorer#]) AS [CountOfScorer#], GoalScoredDetails.GameID, GoalScoredDetails.Date, GoalScoredDetails.Time, PlayerTable.PlayerFullName, GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade, GameDetailsQuery.DistrictMatch, GameDetailsQuery.HomeGame, GameDetailsQuery.Location, GameDetailsQuery.HighSchoolName
FROM ((GoalScoredDetails INNER JOIN PlayerTable ON GoalScoredDetails.[Scorer#] = PlayerTable.PlayerID) INNER JOIN PlayerSeasonTable ON GoalScoredDetails.[Scorer#] = PlayerSeasonTable.[Player#]) INNER JOIN GameDetailsQuery ON (GoalScoredDetails.GameID = GameDetailsQuery.GameID) AND (PlayerSeasonTable.SeasonID = GameDetailsQuery.SeasonIDGames)
GROUP BY GoalScoredDetails.[Scorer#], GoalScoredDetails.GameID, GoalScoredDetails.Date, GoalScoredDetails.Time, PlayerTable.PlayerFullName, GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade, GameDetailsQuery.DistrictMatch, GameDetailsQuery.HomeGame, GameDetailsQuery.Location, GameDetailsQuery.HighSchoolName
ORDER BY Count(GoalScoredDetails.[Scorer#]) DESC , GameDetailsQuery.TimeOfSeason2, PlayerSeasonTable.Grade DESC;
``

### Query: STATSPlayerHatTricks
``sql
SELECT PlayerTable.PlayerFullName, Count(GoalsFor.[GoalsFor#]) AS [CountOfGoalsFor#], GamesTable.Date, GamesTable.Opponent
FROM GamesTable INNER JOIN (PlayerTable INNER JOIN (GoalsFor INNER JOIN Games_InGame_Event_Times ON GoalsFor.GameEventID = Games_InGame_Event_Times.GameEventID) ON PlayerTable.PlayerID = GoalsFor.[Scorer#]) ON GamesTable.GameID = Games_InGame_Event_Times.GameID
GROUP BY PlayerTable.PlayerFullName, GamesTable.Date, GamesTable.Opponent
HAVING (((Count(GoalsFor.[GoalsFor#]))>2));
``

### Query: STATSPlayerSeasonTotals
``sql
SELECT PlayerTable.PlayerFullName, SeasonTable.Season, PlayerSeasonTable.Grade, -1*[SumOfStart] AS Starts, 1*[SumOfGP] AS GP, STATSSeasonTotals.[SumOfPlus/Minus] AS PlusMinus, STATSSeasonTotals.SumOfPlus AS Plus, STATSSeasonTotals.SumOfMinus AS Minus, Int([SumOfMinPlayedGame]/60) AS Minutes, IIf([Minutes]>0,[SumOfPlus/Minus]/[Minutes],0) AS [+/-PerMin], 1*Nz([Goals],0) AS G, 1*Nz([Assists],0) AS A, STATSOffensiveTotals.Points, PlayerTable.PlayerID, STATSGKTotals.SumOfSaves, STATSGKTotals.GoalsAgainst, STATSGKTotals.GKMin, Nz([GoalsAgainst],0)/([GKMin]/80) AS GAA, Nz([GWG],0)*-1 AS GWGoal, Nz([GWA],0)*-1 AS GWAssist, SeasonTable.SeasonID, PlayerTable.PlayerLastName, PlayerTable.PlayerFirstName, -1*[SumOfInjured] AS Inj
FROM (((SeasonTable INNER JOIN (PlayerTable INNER JOIN STATSSeasonTotals ON PlayerTable.PlayerID = STATSSeasonTotals.PlayerID) ON SeasonTable.SeasonID = STATSSeasonTotals.SeasonIDGames) INNER JOIN PlayerSeasonTable ON (SeasonTable.SeasonID = PlayerSeasonTable.SeasonID) AND (PlayerTable.PlayerID = PlayerSeasonTable.[Player#])) INNER JOIN STATSOffensiveTotals ON (SeasonTable.SeasonID = STATSOffensiveTotals.SeasonID) AND (PlayerTable.PlayerID = STATSOffensiveTotals.[Player#])) INNER JOIN STATSGKTotals ON (SeasonTable.SeasonID = STATSGKTotals.SeasonID) AND (PlayerTable.PlayerID = STATSGKTotals.[Player#]);
``

### Query: STATSPlusMinusPerGameGameMinuteEvents
``sql
SELECT Games_InGame_Event_Times.GameEventID, Games_InGame_Event_Times.GameID, Games_InGame_Event_Times.Event, Games_InGame_Event_Times.TimeBegin, Games_InGame_Event_Times.TimeEnd, Games_InGame_Event_Times.PeriodEventTime, Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.StoppedTime, Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID] =" & [GameID] & " and [period]<" & [PeriodEventTime]))+[EventTime] AS GameMinute
FROM Games_InGame_Event_Times;
``

### Query: STATSPlusMinusPerGameGameMinuteSubs
``sql
SELECT InGameStats.SubUniqueID, InGameStats.GameIDInGame, InGameStats.PlayerNoOut, InGameStats.PlayerNoIn, InGameStats.Period, InGameStats.Minute, Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID] =" & [GameIDInGame] & " and [period]<" & [period]))+[Minute] AS GameMinute
FROM InGameStats;
``

### Query: STATSPlusPerGame
``sql
SELECT [Player-GameInfo].PlayerIDPlayerGameInfo, [Player-GameInfo].GameIDPlayerGameInfo, DCount("[playernoin]","[statsplusminuspergamegameminutesubs]","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [PlayerIDPlayerGameInfo] & " and [gameminute]<" & [gameminute])-[start]-DCount("[playernoout]","[statsplusminuspergamegameminutesubs]","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [PlayerIDPlayerGameInfo] & " and  [gameminute]<" & [gameminute]) AS PlayerPlus, Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.PeriodEventTime, Games_InGame_Event_Times.Event, DLookUp("[GameMinute]","[STATSPlusMinusPerGameGameMinuteEvents]","[gameeventid]=" & [gameeventid]) AS GameMinute
FROM [Player-GameInfo] INNER JOIN Games_InGame_Event_Times ON [Player-GameInfo].GameIDPlayerGameInfo = Games_InGame_Event_Times.GameID
WHERE (((Games_InGame_Event_Times.Event)=1));
``

### Query: STATSSeasonTotals
``sql
SELECT PlayerGameDetailsQueryForStats.PlayerID, PlayerGameDetailsQueryForStats.SeasonIDGames, PlayerGameDetailsQueryForStats.Season, Sum(PlayerGameDetailsQueryForStats.Start) AS SumOfStart, Sum(PlayerGameDetailsQueryForStats.GP) AS SumOfGP, Sum(PlayerGameDetailsQueryForStats.[Plus/Minus]) AS [SumOfPlus/Minus], Sum(PlayerGameDetailsQueryForStats.Plus) AS SumOfPlus, Sum(PlayerGameDetailsQueryForStats.Minus) AS SumOfMinus, Sum(PlayerGameDetailsQueryForStats.MinPlayedGame) AS SumOfMinPlayedGame, IIf([sumofminingoal]>0,Round([sumofminingoal]/60)) AS GKMin, Sum(PlayerGameDetailsQueryForStats.Saves) AS SumOfSaves, Sum(PlayerGameDetailsQueryForStats.Shots) AS SumOfShots, Sum(PlayerGameDetailsQueryForStats.MinInGoal) AS SumOfMinInGoal, Sum(PlayerGameDetailsQueryForStats.Injured) AS SumOfInjured
FROM PlayerGameDetailsQueryForStats
GROUP BY PlayerGameDetailsQueryForStats.PlayerID, PlayerGameDetailsQueryForStats.SeasonIDGames, PlayerGameDetailsQueryForStats.Season;
``

### Query: 'SubsEnterGameUpdateTimeQuery
``sql
UPDATE InGameStats SET InGameStats.[Minute] = [Forms]![gamestatsformversion2].[PeriodGameTimeSeconds], InGameStats.Period = [Forms]![gamestatsformversion2].[PeriodNoHolder]
WHERE (((InGameStats.Minute) Is Null));
``

### Query: 'SubsEnterGameUpdateTimeQueryAddPeriod
``sql
UPDATE InGameStats SET InGameStats.Period = [Forms]![GameStatsForm]![GameStatsForm_PeriodsSubForm].[Form]![Period]+1, InGameStats.[Minute] = 0
WHERE (((InGameStats.Minute) Is Null));
``

### Query: 'SubsEnterGameUpdateTimeQueryForPopUp
``sql
UPDATE InGameStats SET InGameStats.[Minute] = [Forms]![GameStatsForm_PopUp_Event]![EventTime]
WHERE (((InGameStats.Minute) Is Null));
``

### Query: TRIAL SEASON MINUTE UPDATE
``sql
SELECT Sum(InGameStats.Minute) AS SumOfMinute, Sum(GamesInfoTimes.PlayedPeriodTime) AS SumOfPlayedPeriodTime, InGameStats.PlayerNoOut, InGameStats.GameIDInGame
FROM [Player-GameInfo] INNER JOIN (GamesInfoTimes INNER JOIN InGameStats ON (InGameStats.GameIDInGame = GamesInfoTimes.GameGameInfoTimesID) AND (GamesInfoTimes.Period = InGameStats.Period)) ON (InGameStats.PlayerNoOut = [Player-GameInfo].PlayerIDPlayerGameInfo) AND ([Player-GameInfo].GameIDPlayerGameInfo = GamesInfoTimes.GameGameInfoTimesID)
GROUP BY InGameStats.PlayerNoOut, InGameStats.GameIDInGame
HAVING (((InGameStats.GameIDInGame)=724));
``

### Query: TRISL UPDATE
``sql
UPDATE [TRIAL SEASON MINUTE UPDATE] INNER JOIN [Player-GameInfo] ON ([TRIAL SEASON MINUTE UPDATE].GameIDInGame = [Player-GameInfo].GameIDPlayerGameInfo) AND ([TRIAL SEASON MINUTE UPDATE].PlayerNoOut = [Player-GameInfo].PlayerIDPlayerGameInfo) SET;
``


## Form RowSource & Subform Queries (163 queries)

### Query: ~sq_cAdjustmentGameStatsForm_PeriodsSubForm_Subs~sq_cPlayer#In
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("[player#in]","ingamestats","[game#]=" & [GameIDPlayerGameInfo] & " and [player#in]=" & [playerid])-[start]-DCount("[player#out]","ingamestats","[game#]=" & [GameIDPlayerGameInfo] & " and [player#out]=" & [playerid]))=0) And ((PlayerGameDetailsQuery.[GameID])=Forms!AdjustmentGameStatsForm!Combo2))
ORDER BY PlayerSeasonTable.[Roster#], PlayerSeasonTable.Varsity;
``

### Query: ~sq_cAdjustmentGameStatsForm_PeriodsSubForm_Subs~sq_cPlayer#Out
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("[player#in]","ingamestats","[game#]=" & [GameIDPlayerGameInfo] & " and [player#in]=" & [playerid])-[start]-DCount("[player#out]","ingamestats","[game#]=" & [GameIDPlayerGameInfo] & " and [player#out]=" & [playerid]))>0) And ((PlayerGameDetailsQuery.[GameID])=Forms!AdjustmentGameStatsForm!Combo2))
ORDER BY PlayerSeasonTable.[Roster#], PlayerSeasonTable.Varsity;
``

### Query: ~sq_cAdjustmentGameStatsForm_PeriodsSubForm~sq_cList2
``sql
SELECT GameDetailsPeriodsQuery.Period, GameDetailsPeriodsQuery.[GameID]
FROM GameDetailsPeriodsQuery
WHERE (((GameDetailsPeriodsQuery.[GameID])=Forms!GameStatsForm!Combo2));
``

### Query: ~sq_cBeepResultsForm~sq_cBeepResults subform
``sql
SELECT BeepResults.PlayerID, BeepResults.SeasonID, BeepResults.RunDate, BeepResults.RunNo, BeepResults.EndRun, PlayerTable.PlayerFullName
FROM (PlayerTable INNER JOIN BeepResults ON PlayerTable.PlayerID = BeepResults.PlayerID) INNER JOIN SeasonTable ON BeepResults.SeasonID = SeasonTable.SeasonID;
``

### Query: ~sq_cBeepResultsSubform~sq_cCombo10
``sql
SELECT PlayerTable.PlayerID, PlayerTable.PlayerFullName
FROM PlayerTable;
``

### Query: ~sq_cCopy Of GameStatsForm_PopUp_Event~sq_cEvent
``sql
SELECT DISTINCTROW *
FROM Games_InGame_Event_Types;
``

### Query: ~sq_cDatabaseDefaultsForm~sq_cHomeLocation
``sql
SELECT LocationTable.LocationID, LocationTable.Location
FROM LocationTable
ORDER BY LocationTable.Location;
``

### Query: ~sq_cFixingSubsForm~sq_cPlayerNoIn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#]
FROM (PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames) AND (PlayerGameDetailsQuery.[GameID] = GamesTable.[GameID])
WHERE (((GamesTable.GameID)=[Forms]![FixingSubsForm]![GameIDInGame]))
ORDER BY PlayerSeasonTable.Varsity;
``

### Query: ~sq_cFixingSubsForm~sq_cPlayerNoOut
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#]
FROM (PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON (PlayerGameDetailsQuery.[GameID] = GamesTable.[GameID]) AND (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames)
WHERE (((GamesTable.GameID)=[Forms]![FixingSubsForm]![GameIDInGame]))
ORDER BY PlayerSeasonTable.Varsity;
``

### Query: ~sq_cGameDetailsByOpponent~sq_cCombo20
``sql
SELECT GamesTable.Opponent, HighSchoolsTable.HighSchoolName
FROM HighSchoolsTable INNER JOIN GamesTable ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent
GROUP BY GamesTable.Opponent, HighSchoolsTable.HighSchoolName
ORDER BY HighSchoolsTable.HighSchoolName;
``

### Query: ~sq_cGameStatsForm_PeriodsSubForm~sq_cGamesTable subform
``sql
PARAMETERS [__Game#] Value;
SELECT DISTINCTROW *
FROM (SELECT [GamesTable].[Game#], [GamesTable].[SeasonIDGames], [GamesTable].[Date], [GamesTable].[Time], [GamesTable].[DepartureTime], [GamesTable].[Opponent], [GamesTable].[Class], [GamesTable].[LocationIDGames], [GamesTable].[HomeGame], [GamesTable].[DistrictMatch], [GamesTable].[GameTypeIDGames], [GamesTable].[Comment], [GamesTable].[CornersFor], [GamesTable].[CornersAgainst], [GamesTable].[FoulsFor], [GamesTable].[FoulsAgainst] FROM GamesTable)  AS GameStatsForm_PeriodsSubForm
WHERE ([__Game#] = [Game#]);
``

### Query: ~sq_cGameStatsForm_PopUp_Event_GoalScored~sq_cAssistedBy#
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start])>0) And ((PlayerGameDetailsQuery.GameID)=Forms!GameStatsForm!Combo2))
ORDER BY PlayerSeasonTable.Varsity, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start] DESC;
``

### Query: ~sq_cGameStatsForm_PopUp_Event_GoalScored~sq_cScorer#
``sql
SELECT PlayerGameDetailsQuery.PlayerID, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start])>0) And ((PlayerGameDetailsQuery.GameID)=Forms!GameStatsForm!Combo2))
ORDER BY PlayerSeasonTable.Varsity, PlayerGameDetailsQuery.PlayerFullName, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start] DESC;
``

### Query: ~sq_cGameStatsForm_PopUp_Event~sq_cEvent
``sql
SELECT DISTINCTROW *
FROM Games_InGame_Event_Types;
``

### Query: ~sq_cGameStatsForm_ShootoutForm~sq_cGK
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsForm]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName, [Player-GameInfo].Saves DESC;
``

### Query: ~sq_cGameStatsForm_ShootoutForm~sq_cKicker
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsForm]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName;
``

### Query: ~sq_cGameStatsForm~sq_cGameStatsForm_PeriodsSubForm
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM GameDetailsPeriodsQuery AS GameStatsForm
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsForm-Delete~sq_cCombo84
``sql
SELECT GameDetailsQuery.[Game#], GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date
FROM GameDetailsQuery
WHERE (((GameDetailsQuery.TimeOfSeason)>1) And ((GameDetailsQuery.TimeOfSeason2)<>"jv") And ((GameDetailsQuery.SeasonID)=Forms!NavigationForm!Season));
``

### Query: ~sq_cGameStatsForm-Delete~sq_cGameStatsForm_SubForm
``sql
PARAMETERS [__Game#] Value;
SELECT DISTINCTROW *
FROM (SELECT GamesTable.[Game#], Games_InGame_Event_Times.TimeBegin, Games_InGame_Event_Times.TimeEnd, Games_InGame_Event_Times.StoppedTime, GamesTable.CornersFor, GamesTable.CornersAgainst, GamesTable.FoulsFor, GamesTable.FoulsAgainst, GameInfoTimes.GameLength, GameInfoTimes.[1stHalf], GameInfoTimes.[2ndHalf], GameInfoTimes.OT1, GameInfoTimes.OT2, GameInfoTimes.SD1, GameInfoTimes.SD2, GameInfoTimes.Shootout, GameInfoTimes.[1], GameInfoTimes.[2], GameInfoTimes.[3], GameInfoTimes.[4], GameInfoTimes.[5], GameInfoTimes.[6], GameInfoTimes.GameLength, GameInfoTimes.[1StartTime], GameInfoTimes.[2StartTime], GameInfoTimes.[3StartTime], GameInfoTimes.[4StartTime], GameInfoTimes.[5StartTime], GameInfoTimes.[6StartTime] FROM (GamesTable LEFT JOIN Games_InGame_Event_Times ON GamesTable.[Game#] = Games_InGame_Event_Times.[Game#]) INNER JOIN GameInfoTimes ON GamesTable.[Game#] = GameInfoTimes.[Game#])  AS [GameStatsForm-Delete]
WHERE ([__Game#] = [Game#]);
``

### Query: ~sq_cGameStatsFormOLD~sq_cCombo1
``sql
SELECT GameDetailsQuery.[Game#], GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date
FROM GameDetailsQuery
WHERE (((GameDetailsQuery.TimeOfSeason)>1) And ((GameDetailsQuery.TimeOfSeason2)<>"jv") And ((GameDetailsQuery.SeasonID)=Forms!NavigationForm!Season));
``

### Query: ~sq_cGameStatsFormVersion2_ShootoutForm~sq_cGK
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsFormVersion2]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName, [Player-GameInfo].Saves DESC;
``

### Query: ~sq_cGameStatsFormVersion2_ShootoutForm~sq_cKicker
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsFormVersion2]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName;
``

### Query: ~sq_cGameStatsFormVersion2_ShootoutFormHorizontal~sq_cGK
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsFormVersion2Horizontal]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName, [Player-GameInfo].Saves DESC;
``

### Query: ~sq_cGameStatsFormVersion2_ShootoutFormHorizontal~sq_cKicker
``sql
SELECT PlayerSeasonTable.[Player#], PlayerTable.PlayerFullName
FROM PlayerTable INNER JOIN (GamesTable INNER JOIN (PlayerSeasonTable INNER JOIN [Player-GameInfo] ON PlayerSeasonTable.[Player#] = [Player-GameInfo].PlayerIDPlayerGameInfo) ON (GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID)) ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=[Forms]![GameStatsFormVersion2Horizontal]![Combo2]))
ORDER BY PlayerSeasonTable.Varsity, PlayerTable.PlayerFirstName, PlayerTable.PlayerLastName;
``

### Query: ~sq_cGameStatsFormVersion2_StartersHorizontal~sq_cGKStart
``sql
SELECT PlayerSeasonTable.[Player#], [roster#] & "     " & [playerfullname] AS Expr1
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[GKRoster#] DESC , PlayerSeasonTable.[Roster#];
``

### Query: ~sq_cGameStatsFormVersion2_StoppagesAdjust~sq_cCombo41
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, PlayerGameDetailsQuery.Dressed
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.Dressed)=True) And ((PlayerGameDetailsQuery.GameID)=Forms!GameStatsFormVersion2Horizontal!Combo2))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion2_StoppagesAdjust~sq_cCombo43
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, PlayerGameDetailsQuery.Dressed
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.Dressed)=True) And ((PlayerGameDetailsQuery.GameID)=Forms!GameStatsFormVersion2Horizontal!Combo2))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion2_StoppagesAdjust~sq_cEvent
``sql
SELECT DISTINCTROW *
FROM Games_InGame_Event_Types;
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild1
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion2
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild2
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion2
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild216
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild3
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion2
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild4
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion2
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild5
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion2
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion2
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cGameStatsFormVersion2_Starters
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], GamesTable.CurrentGK FROM ((PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN PlayerSeasonTable ON [Player-GameInfo].PlayerIDPlayerGameInfo = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON ([Player-GameInfo].[GameIDPlayerGameInfo] = GamesTable.[GameID]) AND (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames) WHERE (((PlayerTable.PlayerID)<>[Forms]![GameStatsFormVersion2]![CurrentGK])) ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion2
WHERE ([__GameID] = GameIDPlayerGameInfo);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cGameStatsFormVersion2Subs
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cGameStatsVersion2SubRecap
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerTable_1.PlayerFullName AS [In], PlayerTable.PlayerFullName AS Out, InGameStats.Period, InGameStats.Minute, InGameStats.GameIDInGame FROM PlayerTable AS PlayerTable_1 INNER JOIN (PlayerTable INNER JOIN InGameStats ON PlayerTable.PlayerID = InGameStats.PlayerNoOut) ON PlayerTable_1.PlayerID = InGameStats.PlayerNoIn)  AS GameStatsFormVersion2
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2~sq_cShootoutForm
``sql
SELECT ShootoutTable.*
FROM GameDetailsQuery INNER JOIN ShootoutTable ON GameDetailsQuery.GameID = ShootoutTable.[Game#];
``

### Query: ~sq_cGameStatsFormVersion2Adjustments~sq_cCombo2
``sql
SELECT GameDetailsQuery.GameID, GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date, GameDetailsQuery.SeasonIDGames
FROM GameDetailsQuery
WHERE (((GameDetailsQuery.SeasonIDGames)=Forms!NavigationForm!Season) And ((GameDetailsQuery.TimeOfSeason3)=2 Or (GameDetailsQuery.TimeOfSeason3)=3))
ORDER BY GameDetailsQuery.Date;
``

### Query: ~sq_cGameStatsFormVersion2Adjustments~sq_cGameTypeIDGames
``sql
SELECT DISTINCTROW *
FROM GameTypesTable;
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cChild215
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS [In], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2!CurrentGK) And ((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=1) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion2Copy
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cChild216
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2Copy
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cChild219
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2 FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion2Copy
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cCombo2
``sql
SELECT GameDetailsQuery.GameID, GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date, GameDetailsQuery.SeasonIDGames
FROM GameDetailsQuery
WHERE (((GameDetailsQuery.SeasonIDGames)=Forms!NavigationForm!Season) And ((GameDetailsQuery.TimeOfSeason3)=2 Or (GameDetailsQuery.TimeOfSeason3)=3))
ORDER BY GameDetailsQuery.Date;
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cGameStatsFormVersion2Subs
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2Copy
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2Copy~sq_cGameTypeIDGames
``sql
SELECT DISTINCTROW *
FROM GameTypesTable;
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild1
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild2
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion2Horizontal
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild216
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild250
``sql
PARAMETERS __gameid Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion2Horizontal
WHERE ([__gameid] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild282
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT ResultsGame.*, HighSchoolsTable.HighSchoolName, SeasonTable.Season, SeasonTable.SeasonID FROM SeasonTable INNER JOIN (HighSchoolsTable INNER JOIN ResultsGame ON HighSchoolsTable.HighSchoolID = ResultsGame.Opponent) ON SeasonTable.SeasonID = ResultsGame.SeasonIDGames)  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild3
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild4
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild5
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion2Horizontal
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cShootoutForm
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT ShootoutTable.* FROM GameDetailsQuery INNER JOIN ShootoutTable ON GameDetailsQuery.GameID = ShootoutTable.[Game#])  AS GameStatsFormVersion2Horizontal
WHERE ([__GameID] = [Game#]);
``

### Query: ~sq_cGameStatsFormVersion2Horizontal~sq_cShotByButton
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS [Shot By]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=Forms!GameStatsFormVersion2Horizontal!Combo2) And ((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion2HorizontalAdjust~sq_cChild329
``sql
PARAMETERS __GameDetailsQuery.GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut] = PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn] = PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Not Null)))  AS GameStatsFormVersion2HorizontalAdjust
WHERE ([__GameDetailsQuery].GameID = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion2SubformStoppageHorizontal~sq_cChild1
``sql
PARAMETERS __GameEventID Value;
SELECT DISTINCTROW *
FROM GoalsFor AS GameStatsFormVersion2SubformStoppageHorizontal
WHERE ([__GameEventID] = GameEventID);
``

### Query: ~sq_cGameStatsFormVersion2SubformStoppageHorizontal~sq_cChild2
``sql
PARAMETERS __GameEventID Value;
SELECT DISTINCTROW *
FROM GoalsAgainst AS GameStatsFormVersion2SubformStoppageHorizontal
WHERE ([__GameEventID] = GameEventID);
``

### Query: ~sq_cGameStatsFormVersion2SubsAdjust~sq_cNoIn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, PlayerGameDetailsQuery.Dressed
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.Dressed)=True) And ((PlayerGameDetailsQuery.GameID)=Forms!GameStatsFormVersion2Horizontal!Combo2))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion2SubsAdjust~sq_cNoOut
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=[Forms]![GameStatsFormVersion2Horizontal]![Combo2]))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_AfterGameForm_Stoppage~sq_cAssister
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_AfterGameForm_Stoppage~sq_cScorer
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_AfterGameForm_StoppageGA~sq_cScoredOn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_AfterGameForm~sq_cGamePicker
``sql
SELECT GameDetailsQuery.GameID, GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date, GameDetailsQuery.SeasonIDGames
FROM GameDetailsQuery
WHERE (((GameDetailsQuery.SeasonIDGames)=strSeasonIDpub()) AND ((GameDetailsQuery.TimeOfSeason3)=2 Or (GameDetailsQuery.TimeOfSeason3)=3))
ORDER BY GameDetailsQuery.Date, GameDetailsQuery.Time;
``

### Query: ~sq_cGameStatsFormVersion3_AfterGameForm~sq_cSeason
``sql
SELECT SeasonTable.SeasonID, SeasonTable.Season
FROM SeasonTable
GROUP BY SeasonTable.SeasonID, SeasonTable.Season
ORDER BY SeasonTable.SeasonID DESC;
``

### Query: ~sq_cGameStatsFormVersion3_GameBreak~sq_cCurrentPlayersStats
``sql
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.GameIDPlayerGameInfo, PlayerGameDetailsQuery.PlayerID, strGameTimepub()*(1+[start]) AS S, PlayerGameDetailsQuery.OutMinutes AS O, PlayerGameDetailsQuery.InMinutes AS I
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])<>strCurrentGKpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#];
``

### Query: ~sq_cGameStatsFormVersion3_GameBreak~sq_cSubsStats
``sql
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Injured
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#];
``

### Query: ~sq_cGameStatsFormVersion3_InGame~sq_cCurrentPlayersStats
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.GameIDPlayerGameInfo, PlayerGameDetailsQuery.PlayerID, strGameTimepub()*(1+[start]) AS S, PlayerGameDetailsQuery.OutMinutes AS O, PlayerGameDetailsQuery.InMinutes AS I FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])<>strCurrentGKpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0)) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3_InGame
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3_InGame~sq_cGKStatsForm
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])=strCurrentGKpub())) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3_InGame
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3_InGame~sq_cShotByButton
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS [Shot By]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_InGame~sq_cSubsForm
``sql
SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName, PlayerTable.PlayerID, *
FROM (InGameStats LEFT JOIN PlayerTable ON InGameStats.[PlayerNoOut] = PlayerTable.PlayerID) LEFT JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn] = PlayerTable_1.PlayerID
WHERE (((InGameStats.Minute) Is Null));
``

### Query: ~sq_cGameStatsFormVersion3_InGame~sq_cSubsStats
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Injured FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3_InGame
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3_InGameVertical~sq_cGKStatsForm
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])=strCurrentGKpub())) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3_InGameVertical
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3_InGameVertical~sq_cShotByButton
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS [Shot By]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_InGameVertical~sq_cSubsForm
``sql
SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName, PlayerTable.PlayerID, *
FROM (InGameStats LEFT JOIN PlayerTable ON InGameStats.[PlayerNoOut] = PlayerTable.PlayerID) LEFT JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn] = PlayerTable_1.PlayerID
WHERE (((InGameStats.Minute) Is Null));
``

### Query: ~sq_cGameStatsFormVersion3_InGameVertical~sq_cSubsStats
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Injured FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3_InGameVertical
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3_Starters_Subs_Subform~sq_cNoIn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Starters_Subs_Subform~sq_cNoOut
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, PlayerGameDetailsQuery.Start, PlayerGameDetailsQuery.Dressed
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.PlayerID)<>strCurrentGKpub()) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerGameDetailsQuery.Dressed)=True))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Starters~sq_cGKStart
``sql
SELECT PlayerSeasonTable.[Player#], [roster#] & "     " & [playerfullname] AS Expr1, PlayerSeasonTable.[GKRoster#], PlayerSeasonTable.[Roster#]
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()))
ORDER BY PlayerSeasonTable.Varsity, IIf([Position] Like "*G*",1,0) DESC , IIf(IsNull([gkroster#]),999,0), PlayerSeasonTable.[GKRoster#], PlayerSeasonTable.[Roster#];
``

### Query: ~sq_cGameStatsFormVersion3_Stoppage_GF~sq_cAssister
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Stoppage_GF~sq_cScorer
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Stoppage~sq_cEvent
``sql
SELECT DISTINCTROW *
FROM Games_InGame_Event_Types;
``

### Query: ~sq_cGameStatsFormVersion3_Subs~sq_cGKNoIn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoout","InGameStats","nz([Period],0)=0   And [PlayerNoout] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((DCount("playernoout","InGameStats","nz([Period],0)=0   And [PlayerNoout] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Subs~sq_cGKNoOut
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.PlayerID)<>strCurrentGKpub()) AND ((DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Subs~sq_cNoIn
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoout","InGameStats","nz([Period],0)=0   And [PlayerNoout] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((DCount("playernoout","InGameStats","nz([Period],0)=0   And [PlayerNoout] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3_Subs~sq_cNoOut
``sql
SELECT PlayerGameDetailsQuery.PlayerID, [roster#] & "     " & [playerfullname] AS Expr1, DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()) AS Expr2, PlayerGameDetailsQuery.Start
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.PlayerID)<>strCurrentGKpub()) AND ((DCount("playernoin","InGameStats","nz([Period],0)=0  And [PlayerNoin] =" & [playerid] & " and [GameIDInGame]=" & strGameIDpub()))=0) AND ((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild1
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion3
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild2
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion3
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild216
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion3
WHERE ([__GameID] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild250
``sql
PARAMETERS __gameid Value;
SELECT DISTINCTROW *
FROM (SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName FROM (InGameStats INNER JOIN PlayerTable ON InGameStats.[PlayerNoOut]=PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn]=PlayerTable_1.PlayerID WHERE (((InGameStats.Minute) Is Null)))  AS GameStatsFormVersion3
WHERE ([__gameid] = GameIDInGame);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild3
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild4
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") AS [In], PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS SubsX, PlayerSeasonTable.Varsity FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null"))=1) And ((PlayerSeasonTable.[Player#])<>Forms!GameStatsFormVersion2Horizontal!CurrentGK) And ((PlayerGameDetailsQuery.Injured)=False)) ORDER BY DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid] & " and [minute] is not null")-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid] & " and [minute] is not null") DESC , PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC , PlayerSeasonTable.Varsity)  AS GameStatsFormVersion3
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild5
``sql
PARAMETERS __GameGameInfoTimesID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & [gameid] & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & [gameid] & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) AS Expr1, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] AS Expr2, PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Dressed FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False) AND ((PlayerGameDetailsQuery.Dressed)=True)) ORDER BY DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoout]=" & [playerid]) DESC , PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], DCount("[playernoin]","ingamestats","[gameidingame]=" & [GameIDPlayerGameInfo] & " and [playernoin]=" & [playerid])+[start] DESC)  AS GameStatsFormVersion3
WHERE ([__GameGameInfoTimesID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA, PlayerGameDetailsQuery.MinInGoal FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) WHERE (((PlayerSeasonTable.[Player#])=[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cGameStatsFormVersion2_Starters
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, PlayerTable.PlayerID, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].Dressed, PlayerSeasonTable.Varsity, [Player-GameInfo].Injured, PlayerSeasonTable.[Roster#], GamesTable.CurrentGK FROM ((PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN PlayerSeasonTable ON [Player-GameInfo].PlayerIDPlayerGameInfo = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames) AND ([Player-GameInfo].[GameIDPlayerGameInfo] = GamesTable.[GameID]) WHERE (((PlayerTable.PlayerID)<>[Forms]![GameStatsFormVersion2Horizontal]![CurrentGK])) ORDER BY [Player-GameInfo].Dressed, PlayerSeasonTable.Varsity, [Player-GameInfo].Injured DESC , PlayerSeasonTable.[Roster#])  AS GameStatsFormVersion3
WHERE ([__GameID] = GameIDPlayerGameInfo);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cGameStatsVersion2EndGameReport
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM GameDetailsQuery AS GameStatsFormVersion3
WHERE ([__GameID] = GameID);
``

### Query: ~sq_cGameStatsFormVersion3~sq_cGameTypeIDGames
``sql
SELECT DISTINCTROW *
FROM GameTypesTable;
``

### Query: ~sq_cGameStatsFormVersion3~sq_cLocationIDGames
``sql
SELECT DISTINCTROW *
FROM LocationTable;
``

### Query: ~sq_cGameStatsFormVersion3~sq_cShootoutForm
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT ShootoutTable.* FROM GameDetailsQuery INNER JOIN ShootoutTable ON GameDetailsQuery.GameID = ShootoutTable.[Game#])  AS GameStatsFormVersion3
WHERE ([__GameID] = [Game#]);
``

### Query: ~sq_cNavigationForm~sq_cNavigationSubform
``sql
SELECT GameDetailsQuery.*, IIf([sumofoppresult]<[sumofresult],"L",IIf([sumofoppresult]>[sumofresult],"W",IIf([GameDetailsQuery]![GoalsScored]>[GameDetailsQuery]![GoalsConceded],"W",IIf([GameDetailsQuery]![GoalsScored]<[GameDetailsQuery]![GoalsConceded],"L","T")))) AS Result, IIf([GameDetailsQuery]![GoalsScored]>[GameDetailsQuery]![GoalsConceded],1,0) AS Wins, IIf([GameDetailsQuery]![GoalsScored]=[GameDetailsQuery]![GoalsConceded],1,0) AS Ties, IIf([GameDetailsQuery]![GoalsScored]<[GameDetailsQuery]![GoalsConceded],1,0) AS Losses
FROM GameDetailsQuery LEFT JOIN GameDetailsQuery_ShootoutResult ON GameDetailsQuery.GameID = GameDetailsQuery_ShootoutResult.[Game#]
WHERE (((GameDetailsQuery.SeasonIDGames)=strSeasonIDpub()) AND ((GameDetailsQuery.TimeOfSeason3)=2) AND ((GameDetailsQuery.TotalGameTime)>"0")) OR (((GameDetailsQuery.SeasonIDGames)=strSeasonIDpub()) AND ((GameDetailsQuery.TimeOfSeason3)=3) AND ((GameDetailsQuery.TotalGameTime)>"0"));
``

### Query: ~sq_cNavigationForm~sq_cSeason
``sql
SELECT SeasonTable.SeasonID, SeasonTable.Season
FROM SeasonTable
GROUP BY SeasonTable.SeasonID, SeasonTable.Season
ORDER BY SeasonTable.SeasonID DESC;
``

### Query: ~sq_cNavigationForm~sq_cSex
``sql
SELECT SeasonTable.SeasonSex, IIf(SeasonTable!SeasonSex="M","Boys","Girls") AS Expr1
FROM SeasonTable
GROUP BY SeasonTable.SeasonSex, IIf(SeasonTable!SeasonSex="M","Boys","Girls");
``

### Query: ~sq_cNavigationForm1~sq_cNavigationSubform
``sql
SELECT DISTINCTROW *
FROM SeasonTable;
``

### Query: ~sq_cNavigationForm1~sq_cSeason
``sql
SELECT SeasonTable.SeasonID, SeasonTable.Season, SeasonTable.SeasonSex
FROM SeasonTable
GROUP BY SeasonTable.SeasonID, SeasonTable.Season, SeasonTable.SeasonSex;
``

### Query: ~sq_cNavigationForm1~sq_cSex
``sql
SELECT SeasonTable.SeasonSex, IIf(SeasonTable!SeasonSex="M","Boys","Girls") AS Expr1
FROM SeasonTable
GROUP BY SeasonTable.SeasonSex, IIf(SeasonTable!SeasonSex="M","Boys","Girls");
``

### Query: ~sq_cNavigationFormold~sq_cSeason
``sql
SELECT SeasonTable.SeasonID, SeasonTable.Season
FROM SeasonTable
GROUP BY SeasonTable.SeasonID, SeasonTable.Season;
``

### Query: ~sq_cPlayerAwards~sq_cPlayerAwardsEarned Subform
``sql
PARAMETERS __ID Value;
SELECT DISTINCTROW *
FROM (SELECT PlayerAwardsEarned.* FROM PlayerAwardsEarned)  AS PlayerAwards
WHERE ([__ID] = AwardID);
``

### Query: ~sq_cPlayerAwardsEarned Subform~sq_cPlayerID
``sql
SELECT PlayerTable.PlayerID, PlayerTable.PlayerFullName, SeasonTable.Season
FROM SeasonTable INNER JOIN (PlayerTable INNER JOIN PlayerSeasonTable ON PlayerTable.PlayerID = PlayerSeasonTable.[Player#]) ON SeasonTable.SeasonID = PlayerSeasonTable.SeasonID;
``

### Query: ~sq_cPlayerAwardsEarned Subform~sq_cSeasonID
``sql
SELECT DISTINCTROW *
FROM SeasonTable;
``

### Query: ~sq_dGameRecapReport~sq_dChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.*, Games_InGame_Event_Types.*, PlayerTable.PlayerFullName AS Scorer, PlayerTable_1.PlayerFullName AS Assister, PlayerTable_2.PlayerFullName AS GK, Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime] AS GameMinute FROM Games_InGame_Event_Types LEFT JOIN ((Games_InGame_Event_Times LEFT JOIN (GoalsAgainst LEFT JOIN PlayerTable AS PlayerTable_2 ON GoalsAgainst.[ScoredOnPlayer#] = PlayerTable_2.PlayerID) ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) LEFT JOIN ((GoalsFor LEFT JOIN PlayerTable ON GoalsFor.[Scorer#] = PlayerTable.PlayerID) LEFT JOIN PlayerTable AS PlayerTable_1 ON GoalsFor.[AssistedBy#] = PlayerTable_1.PlayerID) ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON Games_InGame_Event_Types.ID = Games_InGame_Event_Times.Event)  AS GameRecapReport
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryEmailReport~sq_dChild10
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT [Player-GameInfo].Saves, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].MinInGoal FROM PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo WHERE ((([Player-GameInfo].MinInGoal)>0)))  AS GameSummaryEmailReport
WHERE ([__GameID] = GameIDPlayerGameInfo);
``

### Query: ~sq_dGameSummaryEmailReport~sq_dChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, PlayerTable_1.PlayerFullName, PlayerTable.PlayerFullName, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, Games_InGame_Event_Times.GameID FROM PlayerTable RIGHT JOIN (PlayerTable AS PlayerTable_1 RIGHT JOIN (Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON PlayerTable_1.PlayerID = GoalsFor.[Scorer#]) ON PlayerTable.PlayerID = GoalsFor.[AssistedBy#])  AS GameSummaryEmailReport
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryEmailReport~sq_dChild9
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, PlayerTable.PlayerFullName, Games_InGame_Event_Times.GameID FROM PlayerTable INNER JOIN (Games_InGame_Event_Times INNER JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) ON PlayerTable.PlayerID = GoalsAgainst.[ScoredOnPlayer#])  AS GameSummaryEmailReport
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryReport~sq_dChild10
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT [Player-GameInfo].Saves, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].MinInGoal FROM PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo WHERE ((([Player-GameInfo].MinInGoal)>0)))  AS GameSummaryReport
WHERE ([__GameID] = GameIDPlayerGameInfo);
``

### Query: ~sq_dGameSummaryReport~sq_dChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, PlayerTable_1.PlayerFullName, PlayerTable.PlayerFullName, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, Games_InGame_Event_Times.GameID FROM PlayerTable RIGHT JOIN (PlayerTable AS PlayerTable_1 RIGHT JOIN (Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON PlayerTable_1.PlayerID = GoalsFor.[Scorer#]) ON PlayerTable.PlayerID = GoalsFor.[AssistedBy#])  AS GameSummaryReport
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryReport~sq_dChild9
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, PlayerTable.PlayerFullName, Games_InGame_Event_Times.GameID FROM PlayerTable INNER JOIN (Games_InGame_Event_Times INNER JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) ON PlayerTable.PlayerID = GoalsAgainst.[ScoredOnPlayer#])  AS GameSummaryReport
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryReportGameFinal~sq_dChild10
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT [Player-GameInfo].Saves, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].MinInGoal FROM PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo WHERE ((([Player-GameInfo].MinInGoal)>0)))  AS GameSummaryReportGameFinal
WHERE ([__GameID] = GameIDPlayerGameInfo);
``

### Query: ~sq_dGameSummaryReportGameFinal~sq_dChild6
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, PlayerTable_1.PlayerFullName, PlayerTable.PlayerFullName, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, Games_InGame_Event_Times.GameID FROM PlayerTable RIGHT JOIN (PlayerTable AS PlayerTable_1 RIGHT JOIN (Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON PlayerTable_1.PlayerID = GoalsFor.[Scorer#]) ON PlayerTable.PlayerID = GoalsFor.[AssistedBy#])  AS GameSummaryReportGameFinal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_dGameSummaryReportGameFinal~sq_dChild9
``sql
PARAMETERS __GameID Value;
SELECT DISTINCTROW *
FROM (SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, PlayerTable.PlayerFullName, Games_InGame_Event_Times.GameID FROM PlayerTable INNER JOIN (Games_InGame_Event_Times INNER JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) ON PlayerTable.PlayerID = GoalsAgainst.[ScoredOnPlayer#])  AS GameSummaryReportGameFinal
WHERE ([__GameID] = GameID);
``

### Query: ~sq_fBeepResultsSubform
``sql
SELECT BeepResults.PlayerID, BeepResults.SeasonID, BeepResults.RunDate, BeepResults.RunNo, BeepResults.EndRun, PlayerTable.PlayerFullName
FROM (PlayerTable INNER JOIN BeepResults ON PlayerTable.PlayerID = BeepResults.PlayerID) INNER JOIN SeasonTable ON BeepResults.SeasonID = SeasonTable.SeasonID;
``

### Query: ~sq_fCareerStats
``sql
SELECT STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfStarts, STATSPlayerCareerTotals.SumOfGP, STATSPlayerCareerTotals.SumOfG, STATSPlayerCareerTotals.SumOfA, STATSPlayerCareerTotals.SumOfPoints, STATSPlayerCareerTotals.[SumOf+/-] AS PlusMinus, STATSPlayerCareerTotals.[SumOf+] AS Plus, STATSPlayerCareerTotals.[SumOf-] AS Minus, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal, STATSPlayerCareerTotals.SumOfGWGoal, STATSPlayerCareerTotals.SumOfGWAssist, STATSPlayerCareerTotals.SumOfMinutes, Nz(Nz([SumOfSumOfSaves],0)/(Nz([SumOfGoalsAgainst],1)+[SumOfSumOfSaves]),0)+0 AS SavePerc, Nz([sumofGoalsAgainst],0)/([sumofSumOfMinInGoal]/80) AS GAA, STATSPlayerCareerTotals.PlayerLastName
FROM STATSPlayerCareerTotals
ORDER BY STATSPlayerCareerTotals.PlayerLastName, STATSPlayerCareerTotals.PlayerFirstName;
``

### Query: ~sq_fCareerStatsGKGAA
``sql
SELECT STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal, [sumofsumofsaves]/([sumofsumofsaves]+[sumofgoalsagainst]) AS S, [sumofgoalsagainst]/([sumofsumofMinInGoal]/80) AS GAA
FROM STATSPlayerCareerTotals
GROUP BY STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal
HAVING (((STATSPlayerCareerTotals.SumOfSumOfMinInGoal)>300))
ORDER BY [sumofgoalsagainst]/([sumofsumofMinInGoal]/80);
``

### Query: ~sq_fCareerStatsGKSavePerc
``sql
SELECT STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal, [sumofsumofsaves]/([sumofsumofsaves]+[sumofgoalsagainst]) AS S, [sumofgoalsagainst]/([sumofsumofMinInGoal]/80) AS GAA
FROM STATSPlayerCareerTotals
GROUP BY STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal
HAVING (((STATSPlayerCareerTotals.SumOfSumOfMinInGoal)>300))
ORDER BY [sumofsumofsaves]/([sumofsumofsaves]+[sumofgoalsagainst]) DESC;
``

### Query: ~sq_fCareerStatsGKSaves
``sql
SELECT STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal, [sumofsumofsaves]/([sumofsumofsaves]+[sumofgoalsagainst]) AS S, [sumofgoalsagainst]/([sumofsumofMinInGoal]/80) AS GAA
FROM STATSPlayerCareerTotals
GROUP BY STATSPlayerCareerTotals.PlayerFullName, STATSPlayerCareerTotals.SumOfSumOfSaves, STATSPlayerCareerTotals.SumOfGoalsAgainst, STATSPlayerCareerTotals.SumOfSumOfMinInGoal
HAVING (((STATSPlayerCareerTotals.SumOfSumOfMinInGoal)>300))
ORDER BY STATSPlayerCareerTotals.SumOfSumOfSaves DESC;
``

### Query: ~sq_fDatabaseDefaultsForm
``sql
SELECT DISTINCTROW *
FROM DatabaseDefaults;
``

### Query: ~sq_fDatabaseDefaultsFormOLD
``sql
SELECT DISTINCTROW *
FROM DatabaseDefaults;
``

### Query: ~sq_fGameStatsFormVersion3
``sql
SELECT GamesInfoTimes.*, GameDetailsQuery.*, IIf([period]>0,Nz(DSum("stoppedtime","games_ingame_event_times","[periodeventtime]=" & [Period] & " and [gameid]=" & [GameID]),0),0) AS PeriodStoppedTime
FROM GameDetailsQuery LEFT JOIN GamesInfoTimes ON GameDetailsQuery.GameID = GamesInfoTimes.GameGameInfoTimesID
WHERE (((GameDetailsQuery.TimeOfSeason3)=2 Or (GameDetailsQuery.TimeOfSeason3)=3) AND ((GameDetailsQuery.SeasonIDGames)=strSeasonIDpub()));
``

### Query: ~sq_fGameStatsFormVersion3_AfterGameForm_Stoppage
``sql
SELECT GoalsFor.*, PlayerTable.PlayerFullName AS ScorerName, PlayerTable_1.PlayerFullName AS AssisterName
FROM (PlayerTable RIGHT JOIN GoalsFor ON PlayerTable.PlayerID = GoalsFor.[Scorer#]) LEFT JOIN PlayerTable AS PlayerTable_1 ON GoalsFor.[AssistedBy#] = PlayerTable_1.PlayerID;
``

### Query: ~sq_fGameStatsFormVersion3_AfterGameForm_StoppageGA
``sql
SELECT GoalsAgainst.*, PlayerTable.PlayerFullName AS ScoredOnName
FROM PlayerTable INNER JOIN GoalsAgainst ON PlayerTable.PlayerID = GoalsAgainst.[ScoredOnPlayer#];
``

### Query: ~sq_fGameStatsFormVersion3_EndGame
``sql
SELECT GamesTable.*
FROM GamesTable
WHERE (((GamesTable.GameID)=strGameIDpub()));
``

### Query: ~sq_fGameStatsFormVersion3_GameBreak
``sql
SELECT GamesInfoTimes.*
FROM GamesInfoTimes
WHERE (((GamesInfoTimes.GameGameInfoTimesID)=strGameIDpub()));
``

### Query: ~sq_fgamestatsformversion3_gk
``sql
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Saves, Nz(DCount("[GoalsAgainst#]","GoalAgainstDetails"," [GameID]=" & [gameid] & " and  [ScoredOnPlayer#]=" & [player#]),0) AS GA
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID) AND (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#])
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])=strCurrentGKpub()))
ORDER BY PlayerSeasonTable.[Roster#];
``

### Query: ~sq_fGameStatsFormVersion3_InGame
``sql
SELECT GamesTable.*, GamesInfoTimes.*
FROM GamesTable INNER JOIN GamesInfoTimes ON GamesTable.GameID = GamesInfoTimes.GameGameInfoTimesID
WHERE (((GamesInfoTimes.Period)=strPeriodNoHolderpub()) AND ((GamesTable.GameID)=strGameIDpub()));
``

### Query: ~sq_fGameStatsFormVersion3_InGameVertical
``sql
SELECT GamesTable.*, GamesInfoTimes.*
FROM GamesTable INNER JOIN GamesInfoTimes ON GamesTable.GameID = GamesInfoTimes.GameGameInfoTimesID
WHERE (((GamesInfoTimes.Period)=strPeriodNoHolderpub()) AND ((GamesTable.GameID)=strGameIDpub()));
``

### Query: ~sq_fGameStatsFormVersion3_PlayersOnBench
``sql
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.Dressed, PlayerGameDetailsQuery.Injured
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))=0) AND ((PlayerGameDetailsQuery.Dressed)=True) AND ((PlayerGameDetailsQuery.Injured)=False))
ORDER BY PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#];
``

### Query: ~sq_fgamestatsformversion3_playersonfield
``sql
SELECT PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.GameMinutes, Nz(DLookUp("[CountOfScorer#]","GoalScoredDetailsByScorer"," [GameID] =" & strGameIDpub() & " and [Scorer#] =" & [player#]),0) AS G, PlayerGameDetailsQuery.GameID, PlayerSeasonTable.[Player#], Nz(DLookUp("[CountOfAssistedBy#]","GoalScoredDetailsByAssister"," [GameID] =" & strGameIDpub() & " and [Assistedby#] =" & [player#]),0) AS A, DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]) AS InGame, PlayerSeasonTable.[Roster#], PlayerGameDetailsQuery.GameIDPlayerGameInfo, PlayerGameDetailsQuery.PlayerID, strGameTimepub()*(1+[start]) AS S, PlayerGameDetailsQuery.OutMinutes AS O, PlayerGameDetailsQuery.InMinutes AS I
FROM PlayerGameDetailsQuery INNER JOIN PlayerSeasonTable ON (PlayerGameDetailsQuery.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerGameDetailsQuery.SeasonIDGames = PlayerSeasonTable.SeasonID)
WHERE (((PlayerGameDetailsQuery.GameID)=strGameIDpub()) AND ((PlayerSeasonTable.[Player#])<>strCurrentGKpub()) AND ((DCount("[playernoin]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoin]=" & [playerid])-[start]-DCount("[playernoout]","ingamestats","[gameidingame]=" & strGameIDpub() & " and [playernoout]=" & [playerid]))<>0))
ORDER BY PlayerSeasonTable.[Roster#];
``

### Query: ~sq_fGameStatsFormVersion3_Starters
``sql
SELECT [Player-GameInfo].Start, [Player-GameInfo].Shots, [Player-GameInfo].Saves, [Player-GameInfo].YellowCard, [Player-GameInfo].RedCard, [Player-GameInfo].MinInGoal, [Player-GameInfo].Injured, PlayerTable.PlayerID, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].Dressed, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#], GamesTable.CurrentGK
FROM ((PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].[PlayerIDPlayerGameInfo]) INNER JOIN PlayerSeasonTable ON [Player-GameInfo].PlayerIDPlayerGameInfo = PlayerSeasonTable.[Player#]) INNER JOIN GamesTable ON ([Player-GameInfo].[GameIDPlayerGameInfo] = GamesTable.[GameID]) AND (PlayerSeasonTable.SeasonID = GamesTable.SeasonIDGames)
WHERE (((PlayerTable.PlayerID)<>strCurrentGKpub()) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))
ORDER BY [Player-GameInfo].Injured DESC , [Player-GameInfo].Dressed, PlayerSeasonTable.Varsity, PlayerSeasonTable.[Roster#];
``

### Query: ~sq_fGameStatsFormVersion3_Starters_Subs_Subform
``sql
SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName, PlayerTable.PlayerID, *
FROM (InGameStats LEFT JOIN PlayerTable ON InGameStats.[PlayerNoOut] = PlayerTable.PlayerID) LEFT JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn] = PlayerTable_1.PlayerID
WHERE (((InGameStats.GameIDInGame)=strGameIDpub()))
ORDER BY InGameStats.GameMinute DESC;
``

### Query: ~sq_fGameStatsFormVersion3_Stoppage
``sql
SELECT Games_InGame_Event_Times.*, Nz(DCount("Event","Games_InGame_Event_Times","event=1 and gameid=" & [GameID]),0) AS GF, Nz(DCount("Event","Games_InGame_Event_Times","event=2 and gameid=" & [GameID]),0) AS GA
FROM Games_InGame_Event_Times
WHERE (((Games_InGame_Event_Times.GameID)=strGameIDpub()));
``

### Query: ~sq_fGameStatsFormVersion3_Stoppage_GF
``sql
SELECT GoalsFor.*, PlayerTable.PlayerFullName AS ScorerName, PlayerTable_1.PlayerFullName AS AssisterName
FROM (PlayerTable RIGHT JOIN GoalsFor ON PlayerTable.PlayerID = GoalsFor.[Scorer#]) LEFT JOIN PlayerTable AS PlayerTable_1 ON GoalsFor.[AssistedBy#] = PlayerTable_1.PlayerID;
``

### Query: ~sq_fGameStatsFormVersion3_Subs
``sql
SELECT InGameStats.*, PlayerTable.PlayerFullName AS OutName, PlayerTable_1.PlayerFullName AS InName, PlayerTable.PlayerID, *
FROM (InGameStats LEFT JOIN PlayerTable ON InGameStats.[PlayerNoOut] = PlayerTable.PlayerID) LEFT JOIN PlayerTable AS PlayerTable_1 ON InGameStats.[PlayerNoIn] = PlayerTable_1.PlayerID
WHERE (((InGameStats.Minute) Is Null));
``

### Query: ~sq_fPlayerAwards
``sql
SELECT PlayerAwards.*
FROM PlayerAwards;
``

### Query: ~sq_fPlayerAwardsEarned Subform
``sql
SELECT PlayerAwardsEarned.*
FROM PlayerAwardsEarned;
``

### Query: ~sq_fPlayerLetterWinners
``sql
SELECT PlayerSeasonLetters.*, DLookUp("[1stSeason]","playerseasonsplayed","[playerid]=" & [PlayerSeasontable]![Player#]) AS [First], PlayerTable.PlayerYearEntered9th, DLookUp("[SumOfVarsity]","playerseasonsplayed","[playerid]=" & [PlayerSeasontable]![Player#])*-1 AS SumOfVarsity, PlayerSeasonTable.ParticipatingThisYear, PlayerTable.PlayerFullName, DLookUp("[GP]","[STATSPlayerSeasonTotals]","[seasonid]=" & [PlayerSeasonTable]![SeasonID] & " and [playerid]=" & [PlayerSeasonTable]![Player#]) AS GP, PlayerSeasonTable.ParticipateLastYear, DSum("VarsityPatchNeeded","PlayerSeasonLetters","[Player#]=" & [playerid]) AS LettersEarned, PlayerTable.PlayerID, DLookUp("[Inj]","[STATSPlayerSeasonTotals]","[seasonid]=" & [PlayerSeasonTable]![SeasonID] & " and [playerid]=" & [PlayerSeasonTable]![Player#]) AS Injured
FROM (PlayerSeasonTable LEFT JOIN PlayerTable ON PlayerSeasonTable.[Player#] = PlayerTable.PlayerID) LEFT JOIN PlayerSeasonLetters ON (PlayerSeasonTable.[Player#] = PlayerSeasonLetters.[Player#]) AND (PlayerSeasonTable.SeasonID = PlayerSeasonLetters.SeasonID)
WHERE (((PlayerSeasonTable.ParticipatingThisYear)=True) AND ((PlayerSeasonTable.SeasonID)=strSeasonIDpub()));
``

### Query: ~sq_fSeasonInfoPlayerSubform
``sql
SELECT PlayerSeasonTable.ParticipatingThisYear, IIf(DLookUp("TeamGender","DatabaseDefaults","[id]=1")="F",[playereligibleyearsdomain].[season]-[PlayerYearEntered9th]+9,[playereligibleyearsdomain].[season]-[PlayerYearEntered9th]+8) AS Class, PlayerSeasonTable.Grade, Playertable.PlayerID, PlayerSeasonTable.[Roster#] AS RosterNo, PlayerSeasonTable.Captain, PlayerSeasonTable.Starter, PlayerSeasonTable.ParentLivingHome, PlayerSeasonTable.Enrolled12months, PlayerEligibleYearsDomain.Season, PlayerEligibleYearsDomain.SeasonID, Playertable.PlayerFullName, Playertable.PlayerLastName, Playertable.PlayerFirstName, PlayerSeasonTable.[Player#] AS PlayerNo, PlayerSeasonTable.SeasonID AS PlayerSeason, Playertable.PlayerYearEntered9th, PlayerSeasonTable.Varsity, PlayerSeasonTable.JuniorVarsity, PlayerSeasonTable.Position, PlayerSeasonTable.EarnedCredits, PlayerSeasonTable.[AltRoster#] AS AltNo, PlayerSeasonTable.ParticipateLastYear, Playertable.PlayerDateOfBirth, PlayerSeasonTable.[GKRoster#] AS GKNo
FROM (PlayerEligibleYearsDomain LEFT JOIN PlayerSeasonTable ON (PlayerEligibleYearsDomain.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerEligibleYearsDomain.SeasonID = PlayerSeasonTable.SeasonID)) LEFT JOIN Playertable ON PlayerEligibleYearsDomain.PlayerID = Playertable.PlayerID
ORDER BY PlayerSeasonTable.ParticipatingThisYear, IIf(DLookUp("TeamGender","DatabaseDefaults","[id]=1")="F",[playereligibleyearsdomain].[season]-[PlayerYearEntered9th]+9,[playereligibleyearsdomain].[season]-[PlayerYearEntered9th]+8) DESC , Playertable.PlayerLastName, Playertable.PlayerFirstName;
``

### Query: ~sq_fSeasonStats
``sql
SELECT STATSPlayerSeasonTotals.PlayerFullName, STATSPlayerSeasonTotals.Starts, STATSPlayerSeasonTotals.GP, STATSPlayerSeasonTotals.G, STATSPlayerSeasonTotals.A, STATSPlayerSeasonTotals.Points, STATSPlayerSeasonTotals.PlusMinus, STATSPlayerSeasonTotals.Plus, STATSPlayerSeasonTotals.Minus, STATSPlayerSeasonTotals.SumOfSaves, STATSPlayerSeasonTotals.GoalsAgainst, STATSPlayerSeasonTotals.[GKMin], STATSPlayerSeasonTotals.Grade, STATSPlayerSeasonTotals.Season, STATSPlayerSeasonTotals.GAA, STATSPlayerSeasonTotals.GWGoal, STATSPlayerSeasonTotals.GWAssist, STATSPlayerSeasonTotals.Minutes, STATSPlayerSeasonTotals.SeasonID, Nz(Nz([SumOfSaves],0)/(Nz([GoalsAgainst],1)+[SumOfSaves]),0)+0 AS SavePerc, STATSPlayerSeasonTotals.PlayerLastName, STATSPlayerSeasonTotals.PlayerFirstName
FROM STATSPlayerSeasonTotals
ORDER BY STATSPlayerSeasonTotals.PlayerLastName, STATSPlayerSeasonTotals.PlayerFirstName;
``

### Query: ~sq_fSeasonStatsGKGAA
``sql
SELECT PlayerTable.PlayerFullName, Sum(STATSGKTotals.SumOfSaves) AS S, Sum(STATSGKTotals.[GKMin]) AS [MIN], Sum(STATSGKTotals.GoalsAgainst) AS GA
FROM (PlayerTable INNER JOIN STATSGKTotals ON PlayerTable.PlayerID = STATSGKTotals.[Player#]) INNER JOIN SeasonTable ON STATSGKTotals.SeasonID = SeasonTable.SeasonID
GROUP BY PlayerTable.PlayerFullName
HAVING (((Sum(STATSGKTotals.[GKMin]))>300))
ORDER BY Sum(STATSGKTotals.[GKMin]);
``

### Query: ~sq_fSeasonStatsGKSavePerc
``sql
SELECT PlayerTable.PlayerFullName, STATSGKTotals.SumOfSaves, STATSGKTotals.[GKMin], STATSGKTotals.GoalsAgainst, SeasonTable.Season, Nz([GoalsAgainst],0)/Nz(([GKMin]/80)) AS GAA, IIf(Nz([sumofsaves],0)+Nz([GoalsAgainst],0)=0,0,Nz([sumofsaves],0)/(Nz([sumofsaves],0)+Nz([GoalsAgainst],0))) AS SavePerc
FROM (PlayerTable INNER JOIN STATSGKTotals ON PlayerTable.PlayerID = STATSGKTotals.[Player#]) INNER JOIN SeasonTable ON STATSGKTotals.SeasonID = SeasonTable.SeasonID
WHERE (((STATSGKTotals.[GKMin])>300))
ORDER BY STATSGKTotals.[GKMin], IIf(Nz([sumofsaves],0)+Nz([GoalsAgainst],0)=0,0,Nz([sumofsaves],0)/(Nz([sumofsaves],0)+Nz([GoalsAgainst],0))) DESC;
``

### Query: ~sq_fSeasonStatsGKSaves
``sql
SELECT PlayerTable.PlayerFullName, STATSGKTotals.SumOfSaves, STATSGKTotals.[GKMin], STATSGKTotals.GoalsAgainst, SeasonTable.Season, Nz([GoalsAgainst],0)/Nz(([GKMin]/80)) AS GAA, IIf(Nz([sumofsaves],0)+Nz([GoalsAgainst],0)=0,0,Nz([sumofsaves],0)/(Nz([sumofsaves],0)+Nz([GoalsAgainst],0))) AS SavePerc
FROM (PlayerTable INNER JOIN STATSGKTotals ON PlayerTable.PlayerID = STATSGKTotals.[Player#]) INNER JOIN SeasonTable ON STATSGKTotals.SeasonID = SeasonTable.SeasonID
WHERE (((STATSGKTotals.[GKMin])>300))
ORDER BY STATSGKTotals.SumOfSaves DESC , STATSGKTotals.[GKMin];
``

### Query: ~sq_rBeepCompiledReport
``sql
SELECT BeepResults.*, BeepInformation.*, PlayerTable.PlayerFullName, PlayerSeasonTable.Grade, PlayerSeasonTable.Varsity, PlayerSeasonTable.JuniorVarsity
FROM PlayerTable INNER JOIN ((BeepInformation INNER JOIN BeepResults ON BeepInformation.Run = BeepResults.EndRun) INNER JOIN PlayerSeasonTable ON BeepResults.SeasonID = PlayerSeasonTable.SeasonID) ON (PlayerTable.PlayerID = PlayerSeasonTable.[Player#]) AND (PlayerTable.PlayerID = BeepResults.PlayerID);
``

### Query: ~sq_rGamePointsScored
``sql
SELECT PlayerGameTotalPoints.*, PlayerSeasonTable.Grade, SeasonTable.Season, PlayerTable.PlayerFullName, LocationTable.Location, GameTypesTable.TimeOfSeason2, GameTypesTable.TimeOfSeason3, HighSchoolsTable.HighSchoolName, GamesTable.Date, Nz([PlayerGameTotalPoints]![CountOfScorer#],0)*2+Nz([PlayerGameTotalPoints]![CountOfAssistedBy#],0) AS Points
FROM HighSchoolsTable INNER JOIN (GameTypesTable INNER JOIN (PlayerGameTotalPoints INNER JOIN ((PlayerSeasonTable INNER JOIN PlayerTable ON PlayerSeasonTable.[Player#] = PlayerTable.PlayerID) INNER JOIN (SeasonTable INNER JOIN (LocationTable INNER JOIN GamesTable ON LocationTable.LocationID = GamesTable.LocationIDGames) ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) ON PlayerSeasonTable.SeasonID = SeasonTable.SeasonID) ON (PlayerGameTotalPoints.PlayerIDPlayerGameInfo = PlayerTable.PlayerID) AND (PlayerGameTotalPoints.GameIDPlayerGameInfo = GamesTable.GameID)) ON GameTypesTable.GameTypeID = GamesTable.GameTypeIDGames) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent
WHERE (((GameTypesTable.TimeOfSeason3)=2 Or (GameTypesTable.TimeOfSeason3)=3) And ((Nz(PlayerGameTotalPoints![CountOfScorer#],0)*2+Nz(PlayerGameTotalPoints![CountOfAssistedBy#],0))>5))
ORDER BY Nz([PlayerGameTotalPoints]![CountOfScorer#],0)*2+Nz([PlayerGameTotalPoints]![CountOfAssistedBy#],0) DESC;
``

### Query: ~sq_rGameStatsVersion2EndGameReport_Details
``sql
SELECT SeasonTable.Season, GamesTable.SeasonIDGames, GamesTable.Date, Games_InGame_Event_Times.GameID, Games_InGame_Event_Times.PeriodEventTime, Int([EventTime]/60) AS MinuteP, Games_InGame_Event_Types.EventAbbrev, IIf([GoalsFor]![AssistedBy#]>0,"GOAL by " & [PlayerTable]![PlayerFullName] & " Assisted By " & [PlayerTable_1]![PlayerFullName],"GOAL by " & [PlayerTable]![PlayerFullName]) AS Description, HighSchoolsTable.HighSchoolName,1 FROM HighSchoolsTable INNER JOIN ((SeasonTable INNER JOIN GamesTable ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) INNER JOIN (Games_InGame_Event_Types INNER JOIN ((PlayerTable RIGHT JOIN ((GoalsFor RIGHT JOIN Games_InGame_Event_Times ON GoalsFor.GameEventID = Games_InGame_Event_Times.GameEventID) LEFT JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) ON PlayerTable.PlayerID = GoalsFor.[Scorer#]) LEFT JOIN PlayerTable AS PlayerTable_1 ON GoalsFor.[AssistedBy#] = PlayerTable_1.PlayerID) ON Games_InGame_Event_Types.ID = Games_InGame_Event_Times.Event) ON GamesTable.GameID = Games_InGame_Event_Times.GameID) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent WHERE (((Games_InGame_Event_Types.ID)=1)) ORDER BY 1, GamesTable.Date, Games_InGame_Event_Times.PeriodEventTime, Int([EventTime]/60);   Union SELECT SeasonTable.Season, GamesTable.SeasonIDGames, GamesTable.Date, Games_InGame_Event_Times.GameID, Games_InGame_Event_Times.PeriodEventTime, Int([EventTime]/60) AS MinuteP, Games_InGame_Event_Types.EventAbbrev, "GOAL AGAINST on " & [PlayerTable]![PlayerFullName] AS Description, HighSchoolsTable.HighSchoolName,2 FROM HighSchoolsTable INNER JOIN ((SeasonTable INNER JOIN GamesTable ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) INNER JOIN (Games_InGame_Event_Types INNER JOIN ((Games_InGame_Event_Times LEFT JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) LEFT JOIN PlayerTable ON GoalsAgainst.[ScoredOnPlayer#] = PlayerTable.PlayerID) ON Games_InGame_Event_Types.ID = Games_InGame_Event_Times.Event) ON GamesTable.GameID = Games_InGame_Event_Times.GameID) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent WHERE (((Games_InGame_Event_Types.ID)=2));  UNION SELECT SeasonTable.Season, GamesTable.SeasonIDGames, GamesTable.Date, GamesTable.GameID, InGameStats.Period AS PeriodEventTime, Int([minute]/60) AS MinuteP, "Sub" AS EventAbbrev, [PlayerTable]![PlayerFullName] & " Subbed In For " & [PlayerTable_1]![PlayerFullName] AS Description, HighSchoolsTable.HighSchoolName,3 FROM HighSchoolsTable INNER JOIN (((InGameStats INNER JOIN (SeasonTable INNER JOIN GamesTable ON SeasonTable.SeasonID = GamesTable.SeasonIDGames) ON InGameStats.GameIDInGame = GamesTable.GameID) INNER JOIN PlayerTable ON InGameStats.PlayerNoIn = PlayerTable.PlayerID) INNER JOIN PlayerTable AS PlayerTable_1 ON InGameStats.PlayerNoOut = PlayerTable_1.PlayerID) ON HighSchoolsTable.HighSchoolID = GamesTable.Opponent;
``

### Query: ~sq_rGameStatsVersion2EndGameReport_Players
``sql
SELECT PlayerGameDetailsQuery.GameID, PlayerGameDetailsQuery.Start, PlayerGameDetailsQuery.Shots, PlayerGameDetailsQuery.Saves, PlayerGameDetailsQuery.YellowCard, PlayerGameDetailsQuery.RedCard, PlayerGameDetailsQuery.MinInGoal, PlayerGameDetailsQuery.MinPlayedGame, Nz([Plus],0) AS Pluss, Nz([Minus],0) AS Minuss, Round([MinPlayedGame]/60) AS [Min], PlayerGameDetailsQuery.PlayerFullName, PlayerGameDetailsQuery.Dressed
FROM PlayerGameDetailsQuery
WHERE (((PlayerGameDetailsQuery.Dressed)=True))
ORDER BY Round([MinPlayedGame]/60) DESC , PlayerGameDetailsQuery.PlayerFullName;
``

### Query: ~sq_rGameSummaryEmailSubReport
``sql
SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, PlayerTable_1.PlayerFullName, PlayerTable.PlayerFullName, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, Games_InGame_Event_Times.GameID
FROM PlayerTable RIGHT JOIN (PlayerTable AS PlayerTable_1 RIGHT JOIN (Games_InGame_Event_Times INNER JOIN GoalsFor ON Games_InGame_Event_Times.GameEventID = GoalsFor.GameEventID) ON PlayerTable_1.PlayerID = GoalsFor.[Scorer#]) ON PlayerTable.PlayerID = GoalsFor.[AssistedBy#];
``

### Query: ~sq_rGameSummaryEmailSubReportGA
``sql
SELECT Games_InGame_Event_Times.EventTime, Games_InGame_Event_Times.Details, Games_InGame_Event_Times.PeriodEventTime, (Nz(DSum("[PeriodLength]","[GameDetailsPeriodsQuery]","[GameID]=" & [Games_InGame_Event_Times]![GameID] & " and [Period]<" & [Games_InGame_Event_Times]![PeriodEventTime]),0)+[Games_InGame_Event_Times]![EventTime])/60 AS GameMinute, PlayerTable.PlayerFullName, Games_InGame_Event_Times.GameID
FROM PlayerTable INNER JOIN (Games_InGame_Event_Times INNER JOIN GoalsAgainst ON Games_InGame_Event_Times.GameEventID = GoalsAgainst.GameEventID) ON PlayerTable.PlayerID = GoalsAgainst.[ScoredOnPlayer#];
``

### Query: ~sq_rGameSummaryEmailSubReportSaves
``sql
SELECT [Player-GameInfo].Saves, PlayerTable.PlayerFullName, [Player-GameInfo].GameIDPlayerGameInfo, [Player-GameInfo].MinInGoal
FROM PlayerTable INNER JOIN [Player-GameInfo] ON PlayerTable.PlayerID = [Player-GameInfo].PlayerIDPlayerGameInfo
WHERE ((([Player-GameInfo].MinInGoal)>0));
``

### Query: ~sq_rGameSummaryReportGameFinal
``sql
SELECT ResultsGame.*, HighSchoolsTable.HighSchoolName, SeasonTable.Season, SeasonTable.SeasonID
FROM SeasonTable INNER JOIN (HighSchoolsTable INNER JOIN ResultsGame ON HighSchoolsTable.HighSchoolID = ResultsGame.Opponent) ON SeasonTable.SeasonID = ResultsGame.SeasonIDGames;
``

### Query: ~sq_rGameSummarySubReport
``sql
SELECT IIf([GoalsForTable]![Goal#]<>0,"GOAL","") AS EVENT, GameDetailsQuery.Date, GameDetailsQuery.HighSchoolName, PlayerInfoQuery_1.FullName, PlayerInfoQuery.FullName, GoalsForTable.Minute, GoalsForTable.Comment, GameDetailsQuery.[Game#] FROM ((GameDetailsQuery INNER JOIN GoalsForTable ON GameDetailsQuery.[Game#] = GoalsForTable.[Game#]) LEFT JOIN PlayerInfoQuery AS PlayerInfoQuery_1 ON GoalsForTable.[Scorer#] = PlayerInfoQuery_1.PlayerID) LEFT JOIN PlayerInfoQuery ON GoalsForTable.[AssistedBy#] = PlayerInfoQuery.PlayerID ORDER BY GameDetailsQuery.Date DESC , GoalsForTable.Minute UNION SELECT IIf([GoalsAgainstTable]![GoalAg#]<>0,"Goal Against","") AS Event, GameDetailsQuery.Date, GameDetailsQuery.HighSchoolName, PlayerInfoQuery.FullName, IIf([GoalsAgainstTable]![GoalAg#]<>0,"","") AS Holder, GoalsAgainstTable.Minute, GoalsAgainstTable.Comment, GameDetailsQuery.[Game#] FROM (GameDetailsQuery INNER JOIN GoalsAgainstTable ON GameDetailsQuery.[Game#] = GoalsAgainstTable.[Game#]) INNER JOIN PlayerInfoQuery ON GoalsAgainstTable.[ScoredOnPlayer#] = PlayerInfoQuery.PlayerID UNION SELECT IIf([InGameStats]![Player#Out]<>0,"Substitution","") AS Event, GameDetailsQuery.Date, GameDetailsQuery.HighSchoolName, PlayerInfoQuery.FullName, PlayerInfoQuery_1.FullName, [InGameStats]![Minute]AS [Minute], IIf([InGameStats]![Player#Out]<>0,"","") AS Holder, GameDetailsQuery.[Game#] FROM GameDetailsQuery INNER JOIN ((InGameStats LEFT JOIN PlayerInfoQuery ON InGameStats.[Player#In] = PlayerInfoQuery.PlayerID) LEFT JOIN PlayerInfoQuery AS PlayerInfoQuery_1 ON InGameStats.[Player#Out] = PlayerInfoQuery_1.PlayerID) ON GameDetailsQuery.[Game#] = InGameStats.[Game#]
ORDER BY GameDetailsQuery.Date DESC , GoalsForTable.Minute;
``

### Query: ~sq_rPlayerLetterEarnedReport
``sql
SELECT DLookUp("[PlayerFullName]","[PlayerTable]","[playerid]=" & [PlayerSeasonLetters]![Player#]) AS Fullname, PlayerSeasonLetters.NumberPatchNeeded, PlayerSeasonLetters.VarsityPatchNeeded, PlayerSeasonLetters.Ball, PlayerSeasonLetters.Bar, PlayerSeasonLetters.Certificate, PlayerSeasonLetters.[Number Patch], PlayerSeasonLetters.[Varsity Letter], SeasonTable.Season, SeasonTable.SeasonID, PlayerSeasonLetters.[Player#], DLookUp(" [PlayerFirstName]","[PlayerTable]","[playerid]=" & [PlayerSeasonLetters]![Player#]) AS FirstName, DLookUp("[PlayerLastName]","[PlayerTable]","[playerid]=" & [PlayerSeasonLetters]![Player#]) AS LastName, DLookUp("[PlayerYearEntered9th]","[PlayerTable]","[playerid]=" & [PlayerSeasonLetters]![Player#]) AS YearEntered9th
FROM SeasonTable LEFT JOIN PlayerSeasonLetters ON SeasonTable.SeasonID = PlayerSeasonLetters.SeasonID
WHERE (((SeasonTable.SeasonID)=strSeasonIDpub()));
``

### Query: ~sq_rTSSAA Registration
``sql
SELECT SeasonTable.SeasonID, PlayerSeasonTable.ParticipatingThisYear, PlayerSeasonTable.Enrolled12months, PlayerSeasonTable.Grade, PlayerTable.PlayerLastName, PlayerTable.PlayerFirstName, PlayerTable.PlayerDateOfBirth, PlayerTable.PlayerYearEntered9th, PlayerTable.PlayerCreditsRequiredGrad, PlayerTable.PlayerFullName, PlayerSeasonTable.ParentLivingHome, PlayerSeasonTable.ParticipateLastYear, SeasonTable.Season, PlayerSeasonTable.EarnedCredits, DatabaseDefaults.*, SeasonTable.SchoolYear
FROM DatabaseDefaults, SeasonTable INNER JOIN (PlayerTable INNER JOIN PlayerSeasonTable ON PlayerTable.PlayerID = PlayerSeasonTable.[Player#]) ON SeasonTable.SeasonID = PlayerSeasonTable.SeasonID
WHERE (((SeasonTable.SeasonID)=strSeasonIDpub()) AND ((PlayerSeasonTable.ParticipatingThisYear)=Yes) AND ((PlayerSeasonTable.Enrolled12months)=Yes)) OR (((PlayerSeasonTable.SeasonID)=strSeasonIDpub()))
ORDER BY PlayerTable.PlayerLastName, PlayerTable.PlayerFirstName;
``

