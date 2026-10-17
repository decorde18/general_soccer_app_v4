Attribute VB_Name = "Form_GameStatsFormVersion3_Stoppage"
Attribute VB_Base = "0{850831FD-D210-431A-B635-E8C8AF8512C5}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit
Public Sub StopClockCaption()
If StopClock = -1 Then
StopClock.Caption = "CLOCK IS STOPPED"
Else:
StopClock.Caption = "CLOCK IS RUNNING"
End If
End Sub


Private Sub CancelButton_Click()
Me.Undo
DoCmd.Close
End Sub

Private Sub Form_Close()
DoCmd.OpenForm strGameStatsForm
End Sub

Private Sub Form_Load()
Let GameID = strGame
Let EventTime = strPeriodTime
Let PeriodEventTime = PeriodNoHolder
Let TimeBegin = Int(TimeValue(Format(Now(), "hh:nn:ss")) * 86400)
Let strGF = DCount("[goalsfor#]", "goalsfor", "[gameeventid]=" & GameID)
Let strGA = DCount("[goalsagainst#]", "goalsagainst", "[gameeventid]=" & GameID)
End Sub

Private Sub ResumeGameButton_Click()
    Dim Response
If StoppageMenu = 2 Then
'new code for saving Goal Against
End If

    Let strPeriodStoppedTime = Nz(DSum("stoppedtime", "Games_InGame_Event_Times", "[GameID]=" & strGameIDpub() & " and [PeriodEventTime]=" & PeriodNoHolder), 0)
    
    Let TimeEnd = Int(TimeValue(Format(Now(), "hh:nn:ss")) * 86400)
    If DCount("subuniqueid", "ingamestats", "gameidingame=" & strGameIDpub & " and isnull(minute)=true") = 0 Then GoTo Option1 Else GoTo Option2
Option2:
    Response = MsgBox("Enter All Subs?", vbYesNoCancel)
    If Response = vbCancel Then
    Exit Sub
    ElseIf Response = vbNo Then
    GoTo Option1
    Else:
    Call UpdateSubMinutes
    Call UpdatePlayerGameMinutes
    Call UpdateStarterMinutes
    End If
Option1:
    DoCmd.Close
End Sub


Private Sub StopClock_Click()
StopClockCaption
End Sub

Private Sub StoppageMenu_AfterUpdate()
Me.Details.Visible = True
Me.Details.SetFocus
If StoppageMenu = 1 Then strGF = strGF + 1
If StoppageMenu = 2 Then strGA = strGA + 1

Me.StoppageMenu.Visible = False
Me.STOPPAGE_EVENT.Visible = True
Me.DetailsLabel.Visible = True
Me.StopClock.Visible = True
If Abs(strGF - strGA) > 5 Then StopClock = 0
StopClockCaption
Me.AdditionalDiscipline.Visible = True
Me.ResumeGameButton.Visible = True
Me.GameStatsFormVersion3_Subs.Visible = True
If StoppageMenu = 10 Then
STOPPAGE_EVENT = 0
ElseIf StoppageMenu = 9 Then
STOPPAGE_EVENT = 3
Else:
Let [Event] = StoppageMenu
STOPPAGE_EVENT = StoppageMenu
End If

End Sub
