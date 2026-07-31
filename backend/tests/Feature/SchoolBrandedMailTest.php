<?php

namespace Tests\Feature;

use App\Mail\AccountActivationMail;
use App\Mail\PasswordResetMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\Concerns\SetsUpTenant;
use Tests\TestCase;

/**
 * System mail is sent through one shared, verified Brevo sender — schools
 * don't get their own authenticated sending domain — but should still look
 * and behave like it's from the school: the From name carries the school's
 * name, and replies go to the school's own contact address rather than this
 * app. See App\Mail\Concerns\BrandsFromSchool.
 */
class SchoolBrandedMailTest extends TestCase
{
    use RefreshDatabase, SetsUpTenant;

    public function test_a_teacher_activation_email_is_branded_with_the_schools_name_and_reply_to(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['name' => 'Riverside Academy', 'email' => 'admin@riverside.test', 'type' => 'primary']);
        $owner = $this->createUser($school, 'School Owner');

        $csv = "full_name,email,role\nGrace Teacher,grace@riverside.test,Class Teacher\n";
        $file = UploadedFile::fake()->createWithContent('teachers.csv', $csv);

        $this->actingAs($owner, 'web')->post('/api/school/staff/import', [
            'file' => $file,
            'dry_run' => 'false',
        ]);

        Mail::assertSent(AccountActivationMail::class, function (AccountActivationMail $mail) {
            $envelope = $mail->envelope();

            return $envelope->from->address === config('mail.from.address')
                && $envelope->from->name === 'Riverside Academy (via '.config('app.name').')'
                && $envelope->replyTo[0]->address === 'admin@riverside.test';
        });
    }

    public function test_a_password_reset_email_is_branded_with_the_users_school(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['name' => 'Riverside Academy', 'email' => 'admin@riverside.test']);
        $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'amina@riverside.test']);

        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) {
            $envelope = $mail->envelope();

            return $envelope->subject === 'Reset your Riverside Academy password'
                && $envelope->from->name === 'Riverside Academy (via '.config('app.name').')'
                && $envelope->replyTo[0]->address === 'admin@riverside.test';
        });
    }

    public function test_a_school_with_no_contact_email_gets_no_reply_to_override(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['name' => 'Riverside Academy', 'email' => null]);
        $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        $this->postJson('/api/auth/forgot-password', ['email' => 'amina@riverside.test']);

        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) {
            return $mail->envelope()->replyTo === [];
        });
    }

    public function test_a_user_whose_school_no_longer_exists_gets_generic_branding(): void
    {
        Mail::fake();
        $this->seedPermissions();
        $school = $this->createSchool(['name' => 'Riverside Academy']);
        $user = $this->createUser($school, 'School Owner', ['email' => 'amina@riverside.test']);

        // Simulates users.school_id -> schools.id being nullOnDelete()'d by a
        // hard-deleted school — done at the DB layer, bypassing Eloquent's
        // update event, since LogsActivity would otherwise try to write an
        // activity_logs row with the now-null school_id and violate that
        // table's own NOT NULL constraint (a real user can end up in this
        // state; a *save()* transitioning them into it cannot).
        DB::table('users')->where('id', $user->id)->update(['school_id' => null]);

        $this->postJson('/api/auth/forgot-password', ['email' => 'amina@riverside.test']);

        Mail::assertSent(PasswordResetMail::class, function (PasswordResetMail $mail) {
            $envelope = $mail->envelope();

            return $envelope->subject === 'Reset your '.config('app.name').' password'
                && $envelope->from === null
                && $envelope->replyTo === [];
        });
    }
}
