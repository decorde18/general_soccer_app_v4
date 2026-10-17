Attribute VB_Name = "Form_GameStatsFormVersion3_Subs"
Attribute VB_Base = "0{32156727-8038-48B1-9264-BA5F943C89DF}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Public Sub ResetGKSub()
If IsNull(GKPlayerNoOut) Then
GKNoOut.Requery
GKNoIn.Requery
GKNoIn.Visible = False
GKNoOut.Visible = False
GKInName.Visible = False
GKOutName.Visible = False
ChangeGKButton.Visible = True
ChangeGKButton.SetFocus
SwitchGKButton.Visible = False
CancelGKChange.Visible = False
End If
End Sub
Public Sub SubGKsub()
DoCmd.SetWarnings False
Call UpdateGKMin
If GKNoOut > 0 Then
Let strCurrentGK = GKNoOut
Else:
Let strCurrentGK = GKPlayerNoIn
End If
DoCmd.RunSQL "UPDATE GamesTable SET GamesTable.CurrentGK = strCurrentGKpub() WHERE (((GamesTable.GameID)=strGameIDpub()))"
DoCmd.SetWarnings True
End Sub
Private Sub AllSubs_Click()
If IsNull(PlayerNoIn) = True Then GoTo exitsub
DoCmd.RunCommand acCmdSaveRecord
Call UpdateSubMinutes
Me.Requery
Call UpdatePlayerGameMinutes
Call UpdateStarterMinutes
'If PeriodNoHolder = Period Then
Call UpdateGameStatsForm
'End If
exitsub:
Call ResetGKSub
End Sub

Private Sub CancelGKChange_Click()
NewGK.Visible = False
FieldGK.Visible = False
ChangeGKButton.Visible = True
ChangeGKButton.SetFocus
CancelGKChange.Visible = False
GKOutName.Visible = False
GKNoOut.Visible = False
GKNoIn.Visible = False
GKInName.Visible = False
SwitchGKButton.Visible = False
Let GKNoOut = Null
End Sub

Private Sub ChangeGKButton_Click()
NewGK.Visible = True
FieldGK.Visible = True
NewGK.SetFocus
ChangeGKButton.Visible = False
CancelGKChange.Visible = True

End Sub
Private Sub DeleteSub_Click()
On Error Resume Next
DoCmd.SetWarnings False
Call ResetGKSub

On Error GoTo Command58_Click_Err
    On Error Resume Next
    DoCmd.GoToControl Screen.PreviousControl.Name
    Err.Clear
    If (Not Form.NewRecord) Then
        DoCmd.RunCommand acCmdDeleteRecord
    End If
    If (Form.NewRecord And Form.Dirty) Then
        DoCmd.RunCommand acCmdUndo
    End If
    If (MacroError <> 0) Then
        Beep
        MsgBox MacroError.Description, vbOKOnly, ""
    End If
Command58_Click_Exit:
    Exit Sub
Command58_Click_Err:
    MsgBox Error$
    Resume Command58_Click_Exit

End Sub
Private Sub FieldGK_Click()
NewGK.Visible = False
GKOutName.Visible = True
GKNoOut.Visible = True
GKNoOut.SetFocus
FieldGK.Visible = False
SwitchGKButton.Visible = True
End Sub
Private Sub GKNoIn_AfterUpdate()
Let GKPlayerNoIn = GKNoIn
Let GameIDInGame = strGame
Let GKPlayerNoOut = strCurrentGK
CancelGKChange.Visible = False
End Sub

Private Sub GKNoIn_Enter()
GKNoIn.Requery
End Sub

Private Sub GKNoIn_KeyDown(KeyCode As Integer, Shift As Integer)
 If KeyCode <> vbKeyTab And KeyCode <> vbKeyReturn Then KeyCode = 0
End Sub
Private Sub GKNoOut_AfterUpdate()
SwitchGKButton.Visible = True
End Sub

Private Sub GKNoOut_Enter()
GKNoOut.Requery
End Sub

Private Sub NewGK_Click()
FieldGK.Visible = False
GKNoIn.Visible = True
GKInName.Visible = True
GKNoIn.SetFocus
NewGK.Visible = False
GKNoIn.Dropdown
Let GKNoOut = 0
End Sub
Private Sub NoIn_AfterUpdate()
Let PlayerNoIn = NoIn
Let GameIDInGame = strGame
End Sub
Private Sub NoIn_Enter()
Me.NoIn.Requery
End Sub
Private Sub NoIn_KeyDown(KeyCode As Integer, Shift As Integer)
 If KeyCode <> vbKeyTab And KeyCode <> vbKeyReturn Then KeyCode = 0
End Sub
Private Sub NoOut_AfterUpdate()
Let PlayerNoOut = NoOut
Let GameIDInGame = strGame
End Sub
Private Sub NoOut_Enter()
Me.NoOut.Requery
End Sub
Private Sub NoOut_KeyDown(KeyCode As Integer, Shift As Integer)
 If KeyCode <> vbKeyTab And KeyCode <> vbKeyReturn Then KeyCode = 0
End Sub
Private Sub SingleSub_Click()
If IsNull(PlayerNoIn) = True Then GoTo exitsub
Let Period = PeriodNoHolder
Let Minute = strPeriodTime
Call UpdateGameMinutes
Let GameMinute = strGameTime
If PlayerNoOut = strCurrentGK Then
Call SubGKsub
End If
DoCmd.RunCommand acCmdSaveRecord
Me.Requery
'Call UpdateSubMinutes
Me.Requery
Call UpdatePlayerGameMinutes
Call UpdateStarterMinutes
Call UpdateGameStatsForm
exitsub:
Call ResetGKSub
End Sub
Private Sub Command58_Click()
On Error GoTo Command58_Click_Err
    On Error Resume Next
    DoCmd.GoToControl Screen.PreviousControl.Name
    Err.Clear
    If (Not Form.NewRecord) Then
        DoCmd.RunCommand acCmdDeleteRecord
    End If

    If (Form.NewRecord And Form.Dirty) Then
        DoCmd.RunCommand acCmdUndo
    End If
    If (MacroError <> 0) Then
        Beep
        MsgBox MacroError.Description, vbOKOnly, ""
    End If



Command58_Click_Exit:
    Exit Sub

Command58_Click_Err:
    MsgBox Error$
    Resume Command58_Click_Exit

End Sub
Private Sub SwitchGKButton_Click()
Call SubGKsub
Let GKNoOut = Null
ResetGKSub
UpdateGameStatsForm
End Sub
