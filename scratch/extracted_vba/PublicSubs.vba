Attribute VB_Name = "PublicSubs"
Option Compare Database
Option Explicit
Public Sub UpdateGameMinutes()
Let strGameTime = Nz(DSum("TotalPeriodTime", "GamesInfoTimes", "GameGameInfoTimesID=" & strGameIDpub() & " And [period]<" & strPeriodNoHolderpub()), 0) + strPeriodTimepub()
End Sub
Public Sub UpdateGameStatsForm()
Dim ctlCombo As Control
If CurrentProject.AllForms("GameStatsFormVersion3_GameBreak").IsLoaded Then
Forms("GameStatsFormVersion3_GameBreak").Requery
Else
Forms(strGameStatsForm).Requery
Set ctlCombo = Forms(strGameStatsForm).ShotByButton
ctlCombo.Requery
End If
End Sub
Public Sub UpdatePlayerGameMinutes()
DoCmd.SetWarnings False
'update game minutes for players on the field
'str2 = DSum("PlayerNoIn", "InGameStats", "GameIDInGame=" & strGameIDpub() & " And PlayerNoIn =  [Player-GameInfo]![PlayerIDPlayerGameInfo]")
'Out Minutes
DoCmd.RunSQL "UPDATE InGameStats INNER JOIN [Player-GameInfo] ON ([Player-GameInfo].GameIDPlayerGameInfo = InGameStats.GameIDInGame) AND (InGameStats.PlayerNoOut = [Player-GameInfo].PlayerIDPlayerGameInfo) SET [Player-GameInfo].OutMinutes = strGameTimepub()-Nz(DSum('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoOut=' & [PlayerIDPlayerGameInfo]),0) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
'In Minutes
DoCmd.RunSQL "UPDATE InGameStats INNER JOIN [Player-GameInfo] ON ([Player-GameInfo].GameIDPlayerGameInfo = InGameStats.GameIDInGame) AND (InGameStats.PlayerNoIn = [Player-GameInfo].PlayerIDPlayerGameInfo) SET [Player-GameInfo].InMinutes = strGameTimepub()-Nz(DSum('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoIn=' & [PlayerIDPlayerGameInfo]),0) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
DoCmd.SetWarnings True
End Sub
Public Sub UpdateStarterMinutes()
DoCmd.SetWarnings False
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].StartMinutes = strGameTimepub() WHERE ((([Player-GameInfo].Start) = True) And (([Player-GameInfo].GameIDPlayerGameInfo) = strGameIDpub()))"
DoCmd.SetWarnings True
End Sub

Public Sub UpdateSubMinutes()
DoCmd.SetWarnings False

'Update Minute and Period for Subs
DoCmd.RunSQL "UPDATE InGameStats SET InGameStats.[Minute] = " & strPeriodTime & ", InGameStats.Period =" & PeriodNoHolder & ", InGameStats.GameMinute =" & strGameTime & " WHERE (((InGameStats.Minute) Is Null))"
DoCmd.SetWarnings True
End Sub
Public Sub TeamColors()
Let He = DLookup("SchoolPrimaryColor", "DatabaseDefaults")
Let Re = Val("&H" & Left(Right(He, 6), 2))
Let Gr = Val("&H" & Left(Right(He, 4), 2))
Let Bl = Val("&H" & Right(He, 2))
Let He2 = DLookup("SchoolSecondaryColor", "DatabaseDefaults")
Let Re2 = Val("&H" & Left(Right(He2, 6), 2))
Let Gr2 = Val("&H" & Left(Right(He2, 4), 2))
Let Bl2 = Val("&H" & Right(He2, 2))
Let He3 = DLookup("SchoolTertiaryColor", "DatabaseDefaults")
Let Re3 = Val("&H" & Left(Right(He3, 6), 2))
Let Gr3 = Val("&H" & Left(Right(He3, 4), 2))
Let Bl3 = Val("&H" & Right(He3, 2))
Let RGB1 = RGB(Re, Gr, Bl)
Let RGB2 = RGB(Re2, Gr2, Bl2)
Let RGB3 = RGB(Re3, Gr3, Bl3)
End Sub

Public Sub UpdateGKMin()
DoCmd.SetWarnings False
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].MinInGoal = strGameTimepub()-Nz(DSum('MinInGoal','Player-GameInfo','GameIDPlayerGameInfo=' & strGameIDpub()),0)+Nz(DLookUp('MinInGoal','Player-GameInfo','PlayerIDPlayerGameInfo=' & strCurrentGKpub() & ' and  GameIDPlayerGameInfo=' & strGameIDpub()),0) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()) AND (([Player-GameInfo].PlayerIDPlayerGameInfo)=strCurrentGKpub()))"
End Sub

Public Sub UpdateGamePlayerStats()
'update minutes played
DoCmd.SetWarnings False
DoCmd.RunSQL "UPDATE InGameStats INNER JOIN [Player-GameInfo] ON (InGameStats.PlayerNoOut = [Player-GameInfo].PlayerIDPlayerGameInfo) AND (InGameStats.GameIDInGame = [Player-GameInfo].GameIDPlayerGameInfo) SET [Player-GameInfo].outMinutes = (Nz(DCount('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoout=' & [PlayerIDPlayerGameInfo]),0)*DSum('PlayedPeriodTime','GamesInfoTimes','[GameGameInfoTimesID]=' & strGameIDpub()))-Nz(DSum('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoout=' & [PlayerIDPlayerGameInfo]),0) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
DoCmd.RunSQL "UPDATE InGameStats INNER JOIN [Player-GameInfo] ON (InGameStats.GameIDInGame = [Player-GameInfo].GameIDPlayerGameInfo) AND (InGameStats.PlayerNoIn = [Player-GameInfo].PlayerIDPlayerGameInfo) SET [Player-GameInfo].inMinutes = (Nz(DCount('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoin=' & [PlayerIDPlayerGameInfo]),0)*DSum('PlayedPeriodTime','GamesInfoTimes','[GameGameInfoTimesID]=' & strGameIDpub()))-Nz(DSum('gameMinute','InGameStats','GameIDInGame=' & strGameIDpub() & ' and  PlayerNoin=' & [PlayerIDPlayerGameInfo]),0) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].StartMinutes = DSum('PlayedPeriodTime','GamesInfoTimes','[GameGameInfoTimesID]=' & strGameIDpub())*-[Start] WHERE ((([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Plus = 1*DSum('[PlayerPlus]','[STATSPlusPerGame]','[PlayerIDPlayerGameInfo] =' & [Player-GameInfo]![PlayerIDPlayerGameInfo] & ' and  [GameIDPlayerGameInfo] =' & [Player-GameInfo]![GameIDPlayerGameInfo]), [Player-GameInfo].Minus = 1*DSum('[PlayerMinus]','[STATSMinusPerGame]','[PlayerIDPlayerGameInfo] =' & [Player-GameInfo]![PlayerIDPlayerGameInfo] & ' and  [GameIDPlayerGameInfo] =' & [Player-GameInfo]![GameIDPlayerGameInfo]) WHERE ((([Player-GameInfo].GameIDPlayerGameInfo) = strGameIDpub()))"
DoCmd.SetWarnings True
End Sub
Public Sub UpdatePeriodTime()
Dim PerEndTime, PerStoTime, PerStaTime
Let PerEndTime = DLookup("PeriodEndTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [Period]=" & PeriodNoHolder)
Let PerStaTime = DLookup("PeriodStartTime", "GamesInfoTimes", "[GameGameInfoTimesID]=" & strGame & " and [Period]=" & PeriodNoHolder)
Let strPeriodStoppedTime = Nz(DSum("stoppedtime", "Games_InGame_Event_Times", "[GameID]=" & strGameIDpub() & " and [PeriodEventTime]=" & PeriodNoHolder), 0)



If Nz(PerEndTime, 0) > 0 Then
strPeriodTime = Round((PerEndTime - PerStaTime) * 86400 - Nz(strPeriodStoppedTime, 0) + (Nz(strAdjStopTime, 0)), 0)
Else
strPeriodTime = Round((Now() - PerStaTime) * 86400 - Nz(strPeriodStoppedTime, 0) + (Nz(strAdjStopTime, 0)), 0)
End If
End Sub

