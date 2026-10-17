Attribute VB_Name = "Form_GameStatsFormVersion3"
Attribute VB_Base = "0{0CAB9B87-A5A7-47C4-A3B3-33034D222933}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Public Sub BeforeGameSub()
ReturnToGameButton.Visible = False
EnterStarters.Visible = True
GoalsScored.Visible = False
GoalsConceded.Visible = False
Hyphen.Visible = False
PeriodNoHolder = 0
EnterStarters.Caption = "ENTER STARTERS"
'do we have the gk and starters

If IsNull(strCurrentGK) = False Then
   If DSum("Start", "Player-GameInfo", "[GameIDPlayerGameInfo]=" & strGame) = -11 Then
    BeginGame.Visible = True
    EnterStarters.Caption = "UPDATE STARTERS"
   End If
End If
End Sub

Public Sub FindPeriodSub()
Let PeriodNoHolder = DCount("period", "gamesinfotimes", "[gamegameinfotimesid]=" & strGameIDpub())
If PeriodNoHolder >= Nz([RegPeriods], 0) Then 'end regulation
    If Nz(GoalsScored, 0) = Nz(GoalsConceded, 0) Then 'tie game
        If PeriodNoHolder = RegPeriods - (Nz(MaxOTPeriods, 0) * OTifTied) Then 'if tied and no final period exit to new period
            If SOifTied = -1 Then 'if ot periods are maxed, do we do shootout
            PeriodNoHolder = 11
            'shootoutform dialog
            'EndGameSub
            Exit Sub
            End If
        Else:
DoCmd.Close
            DoCmd.OpenForm "GameStatsFormVersion3_GameBreak"
        Exit Sub
        End If
    End If
    EndGameSub
    Exit Sub
End If
DoCmd.Close
DoCmd.OpenForm "GameStatsFormVersion3_GameBreak"
UpdateGameMinutes 'leave out if doesn't work
End Sub
Public Sub EndGameSub()
Let PeriodNoHolder = 10
DoCmd.Close
DoCmd.OpenForm "GameStatsFormVersion3_EndGame"
'ReturnToGameButton.Caption = "RETURN TO GAME STATS"
End Sub
Public Sub InPeriodSub()
ReturnToGameButton.Caption = "RETURN TO GAME"
Let PeriodNoHolder = Period
DoCmd.Close

DoCmd.OpenForm strGameStatsForm
UpdateGameMinutes 'leave out if doesn't work
End Sub

Public Sub GameControlsOnSub()
EnterStarters.Visible = False
GoalsScored.Visible = True
GoalsConceded.Visible = True
Hyphen.Visible = True
ReturnToGameButton.Visible = True
ReturnToGameButton.SetFocus
BeginGame.Visible = False
End Sub
Private Sub BeginGame_Click()

DoCmd.GoToRecord , , acNewRec
Let GameGameInfoTimesID = strGame
Let [Period] = 1
Let [PeriodNoHolder] = 1
Let [PeriodStartTime] = Now()
DoCmd.RunCommand acCmdSaveRecord
GameControlsOnSub
DoCmd.Close
DoCmd.OpenForm strGameStatsForm
End Sub

Private Sub Form_Close()
GamePicker.Visible = True
SelectGameLabel.Visible = True
ReturnToGame.Visible = False
HighSchoolName.Visible = False
End Sub



Private Sub GamePicker_AfterUpdate()
Dim LabelsOT As Control
'FindGame
Let strGame = GamePicker

Let strCurrentGK = Nz(DLookup("CurrentGK", "GamesTable", "[GameID]=" & strGame), 0)
    DoCmd.SetWarnings False
    DoCmd.RunSQL "UPDATE PlayerGamesUnion_ForUpdateQuery LEFT JOIN [Player-GameInfo] ON (PlayerGamesUnion_ForUpdateQuery.PlayerNo = [Player-GameInfo].PlayerIDPlayerGameInfo) AND (PlayerGamesUnion_ForUpdateQuery.GameID = [Player-GameInfo].GameIDPlayerGameInfo) SET [Player-GameInfo].PlayerIDPlayerGameInfo = [PlayerGamesUnion_ForUpdateQuery]![Playerno], [Player-GameInfo].GameIDPlayerGameInfo = strGameidpub()"
    DoCmd.SetWarnings True
    DoCmd.SearchForRecord , "", acLast, "[GameID] = " & str(Nz(Screen.ActiveControl, 0))
'OT INFORMATION TURNED ON
If OTifTied = -1 Then
    For Each LabelsOT In Me.Controls
        If LabelsOT.Tag = "OT" Then
        LabelsOT.Visible = True
        End If
    Next LabelsOT
Else:
    For Each LabelsOT In Me.Controls
        If LabelsOT.Tag = "OT" Then
        LabelsOT.Visible = False
        End If
    Next LabelsOT
End If
BeginGame.Visible = False
If Period > 0 Then 'GAME HAS STARTED
GameControlsOnSub
If PeriodEndTime > 0 Then
    FindPeriodSub 'PeriodNoHolder BeforeGame=0 Shootout=11, End Game=10
Else: InPeriodSub
    End If
Else: BeforeGameSub 'BEFORE GAME HAS STARTED
End If
End Sub

Private Sub EnterStarters_Click()
DoCmd.OpenForm "GameStatsFormVersion3_Starters"
End Sub

Private Sub Form_Open(Cancel As Integer)

If DLookup("FormsLayout", "DatabaseDefaults", "[id]=1") = -1 Then
strGameStatsForm = "GameStatsFormVersion3_InGameVertical"
Else: strGameStatsForm = "GameStatsFormVersion3_InGame"
End If

DoCmd.Maximize
GoalsScored.Visible = False
GoalsConceded.Visible = False
Hyphen.Visible = False

GamePicker.RowSource = "SELECT GameDetailsQuery.GameID, GameDetailsQuery.HighSchoolName, GameDetailsQuery.Date, GameDetailsQuery.SeasonIDGames FROM GameDetailsQuery WHERE (((GameDetailsQuery.SeasonIDGames) = strSeasonIDpub()) And ((GameDetailsQuery.TimeOfSeason3) = 2 Or (GameDetailsQuery.TimeOfSeason3) = 3)) ORDER BY GameDetailsQuery.Date"

EnterStarters.Visible = False
BeginGame.Visible = False
ReturnToGameButton.Visible = False
'Let strGame = GamePicker
End Sub

Private Sub GamePicker_GotFocus()
    Me.Refresh
Me.GamePicker.Requery
End Sub

Private Sub OTifTied_AfterUpdate()
Dim LabelsOT As Control

If OTifTied = -1 Then
    For Each LabelsOT In Me.Controls
        If LabelsOT.Tag = "OT" Then
        LabelsOT.Visible = True
        End If
    Next LabelsOT
Else:
    For Each LabelsOT In Me.Controls
        If LabelsOT.Tag = "OT" Then
        LabelsOT.Visible = False
        End If
    Next LabelsOT
End If

End Sub

Private Sub ReturnToGame_Click()
Call FindPeriodSub
End Sub

Private Sub ReturnToGameButton_Click()
DoCmd.Close
If Period > 0 Then 'if game has started
GameControlsOnSub
    If PeriodEndTime > 0 Then

    FindPeriodSub 'PeriodNoHolder BeforeGame=0 Shootout=6, End Game=10
    Else: InPeriodSub
    End If
Else: BeforeGameSub 'GoTo BeforeGameCode
End If

End Sub
