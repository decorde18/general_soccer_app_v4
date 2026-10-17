Attribute VB_Name = "Form_GameScheduleForm"
Attribute VB_Base = "0{F78DB09B-A300-493B-854D-0CBC8898937D}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit

Private Sub Command31_Click()
On Error GoTo Err_Command31_Click


    DoCmd.Close

Exit_Command31_Click:
    Exit Sub

Err_Command31_Click:
    MsgBox Err.Description
    Resume Exit_Command31_Click
    
End Sub



Private Sub Command42_Click()

DoCmd.TransferText acExportDelim, , "GameScheduleQueryForCSVExport", "GameSchedule.csv", True

End Sub

Private Sub Form_Load()
Let strHomeLocation = DLookup("HomeLocation", "DatabaseDefaults", "[ID]=1")
End Sub

Private Sub Form_Open(Cancel As Integer)
Me.Filter = "SeasonIDgames = forms!navigationForm!Season"
Me.FilterOn = True
End Sub

Private Sub Command34_Click()
On Error GoTo Err_Command34_Click

    Dim stDocName As String
    Dim stLinkCriteria As String

    stDocName = "HighSchoolMaintenanceForm"
    DoCmd.OpenForm stDocName, , , stLinkCriteria, acFormAdd

Exit_Command34_Click:
    Exit Sub

Err_Command34_Click:
    MsgBox Err.Description
    Resume Exit_Command34_Click
    
End Sub
Private Sub Command35_Click()
On Error GoTo Err_Command35_Click

    Dim stDocName As String

    stDocName = "GameSchedule"
    DoCmd.OpenReport stDocName, acNormal

Exit_Command35_Click:
    Exit Sub

Err_Command35_Click:
    MsgBox Err.Description
    Resume Exit_Command35_Click
    
End Sub

Private Sub Location_AfterUpdate()


If [LocationIDGames] = strHomeLocation Then [HomeGame] = -1 Else [HomeGame] = 0

End Sub

Private Sub Location_NotInList(NewData As String, Response As Integer)
Response = acDataErrContinue
 Dim Db As DAO.Database
Dim rs As DAO.Recordset
Dim Msg As String

Msg = "'" & NewData & "' is not in the list." & vbCr & vbCr
Msg = Msg & "Do you want to add it?"
If MsgBox(Msg, vbQuestion + vbYesNo) = vbNo Then
Response = acDataErrContinue
MsgBox "Try again."
Else
Set Db = CurrentDb
Set rs = Db.OpenRecordset("LocationTable", dbOpenDynaset)

rs.AddNew
rs![Location] = NewData
rs.Update
Response = acDataErrAdded

End If
End Sub





Private Sub GameType_AfterUpdate()
If GameType.Column(2) = 4 Then Let DistrictMatch = 0
End Sub

Private Sub LocationIDGames_AfterUpdate()
If [LocationIDGames] = strHomeLocation Then
Let [HomeGame] = -1
Else:
Let [HomeGame] = 0
End If
End Sub

Private Sub LocationIDGames_NotInList(NewData As String, Response As Integer)
Dim Db As DAO.Database
Dim rs As DAO.Recordset
Dim Msg As String
Dim NewID As String

On Error GoTo Err_CustomerID_NotInList

    ' Exit this subroutine if the combo box was cleared.
    If NewData = "" Then Exit Sub

    ' Confirm that the user wants to add the new customer.
    Msg = "'" & NewData & "' is not in the list." & vbCr & vbCr
    Msg = Msg & "Do you want to add it?"
    If MsgBox(Msg, vbQuestion + vbYesNo) = vbNo Then
        ' If the user chose not to add a customer, set the Response
        ' argument to suppress an error message and undo changes.
        Response = acDataErrContinue
        ' Display a customized message.
        MsgBox "Please try again."
    Else
        ' If the user chose to add a new customer, open a recordset
        ' using the Customers table.
        Set Db = CurrentDb
        Set rs = Db.OpenRecordset("LocationTable", dbOpenDynaset)

        ' Create a new record.
        rs.AddNew
                ' Assign the NewData argument to the CompanyName field.
        rs![Location] = NewData
        ' Save the record.
        rs.Update

        ' Set Response argument to indicate that new data is being added.
        Response = acDataErrAdded

    End If

Exit_CustomerID_NotInList:
       Exit Sub
Err_CustomerID_NotInList:
       ' An unexpected error occurred, display the normal error message.
       MsgBox Err.Description
       ' Set the Response argument to suppress an error message and undo
       ' changes.
       Response = acDataErrContinue

 End Sub


Private Sub Opponent_AfterUpdate()
[Class] = DLookup("[HighSchoolClassification]", "HighSchoolsTable", "[HighSchoolID]=" & [Opponent])
If (DLookup("[HighSchoolClassification]", "HighSchoolsTable", "[HighSchoolID]=" & [Opponent]) = "AAA") Then
If (DLookup("[HighSchoolDistrict]", "HighSchoolsTable", "[HighSchoolID]=" & [Opponent]) = "12") Then
Let [DistrictMatch] = -1
Else
End If
End If
Let [SeasonIDGames] = [Forms]![navigationform]![Season]
End Sub

Private Sub Opponent_notInList(NewData As String, Response As Integer)
On Error GoTo errline
Dim msgboxanswer As Variant

Response = acDataErrContinue
msgboxanswer = MsgBox("Do you want to add this new high school?", vbYesNo, "Add New High School?")
If msgboxanswer = vbNo Then
DoCmd.SetWarnings False


DoCmd.GoToControl "opponent"
DoCmd.SetWarnings True

GoTo exitline
Else
DoCmd.OpenForm ("HighSchoolMaintenanceForm")
DoCmd.GoToRecord , , acNewRec
Forms![HighSchoolMaintenanceForm]![HighSchoolName] = NewData
Me.Opponent = Null
DoCmd.GoToControl "HighSchooladdress"
End If
exitline:
Exit Sub
errline:
    MsgBox Err.Description
    Resume exitline

End Sub


