Attribute VB_Name = "Form_DatabaseDefaultsForm"
Attribute VB_Base = "0{24EBC3B1-61F5-4F51-8C50-FDB6172E8752}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Command36_Click()
Let TabCtl32.Value = 1
End Sub

Private Sub Command37_Click()
Let TabCtl32.Value = 0
End Sub

Private Sub Command38_Click()
Let TabCtl32.Value = 0
End Sub

Private Sub Command41_Click()
Let TabCtl32.Value = 2
End Sub

Private Sub Command43_Click()
Let TabCtl32.Value = 2
End Sub

Private Sub Command46_Click()
Let TabCtl32.Value = 1
End Sub

Private Sub Form_Close()
DoCmd.OpenForm ("navigationform")
End Sub
'------------------------------------------------------------
' CloseButton_Click
'
'------------------------------------------------------------
Private Sub CloseButton_Click()
    DoCmd.Close acForm, ("navigationbackground")

DoCmd.OpenForm "navigationbackground"
    DoCmd.Close acForm, ("databasedefaultsform")

End Sub


Private Sub HomeLocation_AfterUpdate()
If [HomeLocation] = 15 Then
Let [HomeGame] = -1
End If
End Sub

Private Sub HomeLocation_NotInList(NewData As String, Response As Integer)
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
